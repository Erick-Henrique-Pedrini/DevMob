import { test, expect } from '@playwright/test'

const EMAIL = 'e2e-loc-test@example.com'
const PASSWORD = 'Senha123!'
const COORDS = { latitude: -26.9154, longitude: -49.0719, accuracy: 15 }
// Sufixo único por execução para não colidir com tarefas de execuções anteriores
const RUN_ID = Date.now()

async function login(page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Senha').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation(COORDS)

  // Evita depender do serviço público do Nominatim durante os testes
  await page.route('**/nominatim.openstreetmap.org/reverse**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        display_name: 'Rua Teste, 123, Centro, Cidade Teste',
        address: { road: 'Rua Teste' },
      }),
    })
  })

  await login(page)
})

test('captures current location and shows accuracy badge and address', async ({ page }) => {
  await page.getByPlaceholder('Nova tarefa...').fill(`Tarefa com localização ${RUN_ID}`)
  await page.getByRole('button', { name: 'Usar localização atual' }).click()

  await expect(page.locator('.location-badge')).toHaveText('Precisão boa')
  await expect(page.locator('.location-coords')).toHaveText('-26.91540, -49.07190')
  await expect(page.locator('.location-label')).toHaveText('Rua Teste')
  await expect(page.locator('.task-location-map')).toBeVisible()
})

test('saves task with location and shows pin tag in the list', async ({ page }) => {
  const title = `Tarefa geolocalizada ${RUN_ID}`
  await page.getByPlaceholder('Nova tarefa...').fill(title)
  await page.getByRole('button', { name: 'Usar localização atual' }).click()
  await expect(page.locator('.location-badge')).toHaveText('Precisão boa')

  await page.getByRole('button', { name: 'Adicionar' }).click()

  const taskItem = page.locator('.task-item', { hasText: title })
  await expect(taskItem.locator('.task-location-tag')).toContainText('Rua Teste')
})

test('filters tasks by "Somente com localização"', async ({ page }) => {
  const withoutLocation = `Tarefa sem localização ${RUN_ID}`
  const withLocation = `Tarefa com pin ${RUN_ID}`

  // Tarefa sem localização
  await page.getByPlaceholder('Nova tarefa...').fill(withoutLocation)
  await page.getByRole('button', { name: 'Adicionar' }).click()

  // Tarefa com localização
  await page.getByPlaceholder('Nova tarefa...').fill(withLocation)
  await page.getByRole('button', { name: 'Usar localização atual' }).click()
  await expect(page.locator('.location-badge')).toHaveText('Precisão boa')
  await page.getByRole('button', { name: 'Adicionar' }).click()

  await expect(page.locator('.task-item', { hasText: withoutLocation })).toBeVisible()

  await page.getByLabel('Somente com localização').check()

  await expect(page.locator('.task-item', { hasText: withLocation })).toBeVisible()
  await expect(page.locator('.task-item', { hasText: withoutLocation })).toHaveCount(0)
})

test('removing location clears the badge and map before saving', async ({ page }) => {
  await page.getByPlaceholder('Nova tarefa...').fill(`Tarefa a remover localização ${RUN_ID}`)
  await page.getByRole('button', { name: 'Usar localização atual' }).click()
  await expect(page.locator('.location-badge')).toBeVisible()

  await page.getByRole('button', { name: 'Remover localização' }).click()

  await expect(page.locator('.location-badge')).toHaveCount(0)
  await expect(page.locator('.task-location-map')).toHaveCount(0)
})
