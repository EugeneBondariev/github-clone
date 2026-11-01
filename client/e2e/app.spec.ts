import { test, expect } from '@playwright/test'

test('full user flow: register → create → edit → delete repo', async ({ page }) => {
  const id = Date.now()
  const email = `user_${id}@example.com`
  const repoName = `repo-${id}`

  // Register
  await page.goto('/register')
  await page.getByLabel('Name').fill('Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Register' }).click()

  // Redirected to home, logged in
  await expect(page).toHaveURL('/')
  await expect(page.getByText('New repo')).toBeVisible()

  // Create repo
  await page.getByText('New repo').click()
  await expect(page).toHaveURL('/repos/new')
  await page.getByLabel('Name').fill(repoName)
  await page.getByLabel(/description/i).fill('A test repo')
  await page.getByRole('button', { name: 'Create repository' }).click()

  // Redirected to detail page
  await expect(page).toHaveURL(/\/repos\/\d+/)
  await expect(page.getByText(repoName)).toBeVisible()
  await expect(page.getByText('A test repo')).toBeVisible()

  // Edit repo
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Name').clear()
  await page.getByLabel('Name').fill(`${repoName}-updated`)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(`${repoName}-updated`)).toBeVisible()

  // Delete repo
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByText(`${repoName}-updated`)).not.toBeVisible()
})

test('login flow', async ({ page }) => {
  // Attempt login with wrong password
  await page.goto('/login')
  await page.getByLabel('Email').fill('nobody@example.com')
  await page.getByLabel('Password').fill('wrongpass')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByText('invalid credentials')).toBeVisible()
})
