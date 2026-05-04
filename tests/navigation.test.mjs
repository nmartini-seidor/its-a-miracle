import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'

const { isSectionActive, workspaceSections } = await import('../lib/navigation.ts')

test('workspace navigation exposes the approved top-level sections', () => {
  assert.deepEqual(workspaceSections, [
    { label: 'Products', href: '/', icon: 'products' },
    { label: 'Catalog', href: '/catalog', icon: 'catalog' },
    { label: 'Schemas', href: '/schemas', icon: 'schemas' },
    { label: 'Aggregators', href: '/aggregators', icon: 'aggregators' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ])
})

test('active-state helper matches root and nested section routes', () => {
  assert.equal(isSectionActive('/', '/'), true)
  assert.equal(isSectionActive('/catalog', '/'), false)
  assert.equal(isSectionActive('/schemas', '/schemas'), true)
  assert.equal(isSectionActive('/schemas/headphones-earbuds', '/schemas'), true)
  assert.equal(isSectionActive('/settings', '/aggregators'), false)
})

test('top-level shell sections have concrete route files and a mobile fallback nav component', () => {
  for (const section of workspaceSections.filter((section) => section.href !== '/')) {
    assert.equal(existsSync(`app${section.href}/page.tsx`.replace('//', '/')), true, `${section.href} route file should exist`)
  }
  assert.equal(existsSync('./components/app/mobile-nav.tsx'), true)
  assert.equal(existsSync('./components/app/navigation-icons.tsx'), true)
})

test('workspace navigation carries an icon key for every visible section', () => {
  assert.deepEqual(
    workspaceSections.map((section) => section.icon),
    ['products', 'catalog', 'schemas', 'aggregators', 'settings'],
  )
})
