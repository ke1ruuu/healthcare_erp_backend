#!/usr/bin/env bun

// ==============================================================================
// Architectural Boundary & Dependency Rule Checker
// Scans TypeScript source files to prevent uncontrolled cross-module imports
// ==============================================================================

import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

interface Violation {
  file: string
  line: number
  rule: string
  importPath: string
  message: string
}

const SRC_DIR = join(import.meta.dir, '../src')

// Downstream modules that Upstream master data modules must NEVER import
const DOWNSTREAM_MODULES = [
  'billing',
  'prescriptions',
  'appointments',
  'pharmacy',
  'laboratory',
  'inventory',
  'clinical',
]

// Upstream master data modules
const UPSTREAM_MODULES = ['users', 'patients', 'audit-logs']

async function getTsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        return getTsFiles(fullPath)
      } else if (entry.isFile() && fullPath.endsWith('.ts')) {
        return [fullPath]
      }
      return []
    })
  )
  return files.flat()
}

function parseImports(content: string): { line: number; importPath: string }[] {
  const lines = content.split('\n')
  const imports: { line: number; importPath: string }[] = []

  const importRegex = /(?:import|export)\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/

  lines.forEach((lineText, idx) => {
    const match = lineText.match(importRegex)
    if (match && match[1]) {
      imports.push({
        line: idx + 1,
        importPath: match[1],
      })
    }
  })

  return imports
}

async function checkArchitecturalBoundaries(): Promise<Violation[]> {
  const violations: Violation[] = []
  const files = await getTsFiles(SRC_DIR)

  for (const filePath of files) {
    const relPath = relative(SRC_DIR, filePath)
    const content = await readFile(filePath, 'utf-8')
    const imports = parseImports(content)

    // Determine what layer the current file is in
    const isShared = relPath.startsWith('shared/')
    const isConfig = relPath.startsWith('config/')
    const isDb = relPath.startsWith('db/')
    const isModule = relPath.startsWith('modules/')
    const currentModule = isModule ? relPath.split('/')[1] : null

    for (const { line, importPath } of imports) {
      // RULE 1: Shared Kernel, Config, and DB must NEVER import from Domain Modules
      if ((isShared || isConfig || isDb) && (importPath.startsWith('@/modules') || importPath.includes('/modules/'))) {
        violations.push({
          file: relPath,
          line,
          rule: 'SHARED_KERNEL_ISOLATION',
          importPath,
          message: `Shared layer (${relPath}) must not depend on domain modules.`,
        })
      }

      // RULE 2: No Deep Imports into other Domain Modules (must import from module root index.ts)
      if (importPath.startsWith('@/modules/')) {
        const parts = importPath.replace('@/modules/', '').split('/')
        const targetModule = parts[0]
        const subPath = parts.slice(1).join('/')

        if (targetModule && subPath && targetModule !== currentModule) {
          violations.push({
            file: relPath,
            line,
            rule: 'NO_DEEP_MODULE_IMPORTS',
            importPath,
            message: `Deep import into module "${targetModule}/${subPath}" is forbidden. Import only from "@/${parts[0]}" public entrypoint.`,
          })
        }
      }

      // RULE 3: Upstream master data modules must NEVER import downstream transactional modules
      if (isModule && currentModule && UPSTREAM_MODULES.includes(currentModule)) {
        for (const downstream of DOWNSTREAM_MODULES) {
          if (
            importPath === `@/modules/${downstream}` ||
            importPath.startsWith(`@/modules/${downstream}/`) ||
            importPath.includes(`/${downstream}/`)
          ) {
            violations.push({
              file: relPath,
              line,
              rule: 'UPSTREAM_DEPENDS_ON_DOWNSTREAM',
              importPath,
              message: `Upstream master data module "${currentModule}" cannot depend on downstream module "${downstream}".`,
            })
          }
        }
      }
    }
  }

  return violations
}

async function main() {
  console.log('🔍 Checking architectural module boundaries and import rules...')
  const violations = await checkArchitecturalBoundaries()

  if (violations.length === 0) {
    console.log('✅ All module boundaries, shared kernel rules, and import policies passed successfully!\n')
    process.exit(0)
  }

  console.error(`\n❌ Found ${violations.length} architectural boundary violation(s):\n`)
  violations.forEach((v, index) => {
    console.error(`  [${index + 1}] Rule: ${v.rule}`)
    console.error(`      File: src/${v.file}:${v.line}`)
    console.error(`      Import: "${v.importPath}"`)
    console.error(`      Detail: ${v.message}\n`)
  })

  process.exit(1)
}

main()
