import { describe, it, expect, beforeEach } from 'vitest'
import { useNotification, notify } from '@/composables/useNotification.js'

describe('useNotification', () => {
  let notif

  beforeEach(() => {
    notif = useNotification()
    // El estado es un singleton a nivel de módulo; lo limpiamos entre tests
    notif.notifications.splice(0)
  })

  // ── métodos de creación ────────────────────────────────────────────────────

  describe('success', () => {
    it('agrega una notificación de tipo success', () => {
      notif.success('Guardado correctamente')

      expect(notif.notifications).toHaveLength(1)
      expect(notif.notifications[0]).toMatchObject({
        type: 'success',
        title: 'Éxito',
        message: 'Guardado correctamente',
      })
    })

    it('acepta título personalizado', () => {
      notif.success('Registro creado', 'Operación exitosa')
      expect(notif.notifications[0].title).toBe('Operación exitosa')
    })

    it('retorna el id de la notificación creada', () => {
      const id = notif.success('Test')
      expect(typeof id).toBe('number')
    })
  })

  describe('error', () => {
    it('agrega una notificación de tipo error con título por defecto', () => {
      notif.error('Error de red')
      expect(notif.notifications[0]).toMatchObject({ type: 'error', title: 'Error' })
    })
  })

  describe('warning', () => {
    it('agrega una notificación de tipo warning', () => {
      notif.warning('Acción irreversible')
      expect(notif.notifications[0].type).toBe('warning')
    })
  })

  describe('info', () => {
    it('agrega una notificación de tipo info', () => {
      notif.info('Información general')
      expect(notif.notifications[0].type).toBe('info')
    })
  })

  // ── dismiss ────────────────────────────────────────────────────────────────

  describe('dismiss', () => {
    it('elimina la notificación con el id indicado', () => {
      const id = notif.success('Test')
      expect(notif.notifications).toHaveLength(1)

      notif.dismiss(id)
      expect(notif.notifications).toHaveLength(0)
    })

    it('no hace nada si el id no existe', () => {
      notif.success('Persistente')
      notif.dismiss(99999)
      expect(notif.notifications).toHaveLength(1)
    })

    it('elimina solo la notificación correcta cuando hay varias', () => {
      const id1 = notif.success('Primera')
      notif.error('Segunda')

      notif.dismiss(id1)

      expect(notif.notifications).toHaveLength(1)
      expect(notif.notifications[0].type).toBe('error')
    })
  })

  // ── notify (API genérica) ──────────────────────────────────────────────────

  describe('notify', () => {
    it('crea notificación con type, title y message personalizados', () => {
      notif.notify({ type: 'warning', title: 'Atención', message: 'Datos incompletos' })
      expect(notif.notifications[0]).toMatchObject({
        type: 'warning',
        title: 'Atención',
        message: 'Datos incompletos',
      })
    })

    it('usa type "info" por defecto', () => {
      notif.notify({ message: 'Sin tipo' })
      expect(notif.notifications[0].type).toBe('info')
    })
  })

  // ── estado singleton ───────────────────────────────────────────────────────

  describe('estado singleton entre instancias', () => {
    it('dos llamadas a useNotification() comparten el mismo array', () => {
      const n1 = useNotification()
      const n2 = useNotification()

      n1.success('Desde n1')
      expect(n2.notifications).toHaveLength(1)
    })
  })

  // ── re-exportación `notify` ────────────────────────────────────────────────

  describe('notify (exportación directa fuera de componentes)', () => {
    it('agrega notificación via notify.success', () => {
      notify.success('Directo')
      const last = notif.notifications[notif.notifications.length - 1]
      expect(last).toMatchObject({ type: 'success', message: 'Directo' })
    })

    it('notify.error usa título "Error" por defecto', () => {
      notify.error('Algo falló')
      const last = notif.notifications[notif.notifications.length - 1]
      expect(last).toMatchObject({ type: 'error', title: 'Error' })
    })

    it('notify.warning usa título "Advertencia" por defecto', () => {
      notify.warning('Cuidado')
      const last = notif.notifications[notif.notifications.length - 1]
      expect(last.title).toBe('Advertencia')
    })

    it('notify.dismiss elimina por id', () => {
      const id = notify.success('Para eliminar')
      notify.dismiss(id)
      expect(notif.notifications.find(n => n.id === id)).toBeUndefined()
    })
  })
})
