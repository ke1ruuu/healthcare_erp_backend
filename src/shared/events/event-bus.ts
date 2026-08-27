export interface DomainEventsMap {
  'user:created': {
    userId: string
    email: string
    role: string
    timestamp: Date
  }
  'patient:registered': {
    patientId: string
    medicalRecordNumber: string
    actorId?: string
    timestamp: Date
  }
  'patient:updated': {
    patientId: string
    updatedFields: string[]
    actorId?: string
    timestamp: Date
  }
  'patient:deleted': {
    patientId: string
    actorId?: string
    timestamp: Date
  }
}

export type EventHandler<T> = (payload: T) => Promise<void> | void

export class EventBus {
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map()

  subscribe<K extends keyof DomainEventsMap>(
    event: K,
    handler: EventHandler<DomainEventsMap[K]>
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }

    const eventHandlers = this.handlers.get(event)!
    eventHandlers.add(handler as EventHandler<unknown>)

    return () => {
      eventHandlers.delete(handler as EventHandler<unknown>)
    }
  }

  async publish<K extends keyof DomainEventsMap>(
    event: K,
    payload: DomainEventsMap[K]
  ): Promise<void> {
    const eventHandlers = this.handlers.get(event)
    if (!eventHandlers || eventHandlers.size === 0) {
      return
    }

    const promises = Array.from(eventHandlers).map(async (handler) => {
      try {
        await handler(payload)
      } catch (error) {
        console.error(`[EventBus] Error in handler for event "${String(event)}":`, error)
      }
    })

    await Promise.all(promises)
  }

  clear(): void {
    this.handlers.clear()
  }
}

export const eventBus = new EventBus()
