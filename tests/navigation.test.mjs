import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const { isSectionActive, workspaceSections } = await import('../lib/navigation.ts')

test('workspace navigation exposes the approved top-level sections', () => {
  assert.deepEqual(workspaceSections, [
    { label: 'Products', href: '/', icon: 'products' },
    { label: 'Catalog', href: '/catalog', icon: 'catalog' },
    { label: 'Schemas', href: '/schemas', icon: 'schemas' },
    { label: 'Aggregators', href: '/aggregators', icon: 'aggregators' },
    { label: 'Research', href: '/research', icon: 'research' },
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

test('app header uses the Data Harbor static logo', () => {
  const layoutSource = readFileSync('app/layout.tsx', 'utf8')
  const brandMarkup = layoutSource.slice(layoutSource.indexOf('aria-label="Home"'), layoutSource.indexOf('<TopNav />'))

  assert.equal(existsSync('public/data-harbor-logo.svg'), true)
  assert.equal(existsSync('data-harbor-logo.svg'), false)
  const logoSource = readFileSync('public/data-harbor-logo.svg', 'utf8')

  assert.equal(brandMarkup.includes('src="/data-harbor-logo.svg?v=full-crop-20260508"'), true)
  assert.equal(layoutSource.includes('import Image from "next/image"'), true)
  assert.equal(brandMarkup.includes('>Data Harbor<'), false)
  assert.equal(brandMarkup.includes('Mirakl enrichment'), false)
  assert.equal(brandMarkup.includes('Mirakl Control'), false)
  assert.equal(brandMarkup.includes('ShieldCheckIcon'), false)
  assert.equal(brandMarkup.includes('bg-white p-2 shadow-'), false)
  assert.equal(brandMarkup.includes('border border-blue-100'), false)
  assert.equal(brandMarkup.includes('className="h-14 w-auto object-contain'), true)
  assert.equal(brandMarkup.includes('className="h-16 w-auto object-contain'), false)
  assert.equal(brandMarkup.includes('className="h-10 w-auto object-contain'), false)
  assert.equal(logoSource.includes('fill="#2563eb"'), true)
  assert.equal(logoSource.includes('fill="#000000"'), false)
  assert.equal(logoSource.includes('viewBox="488 293 523 350"'), true)
  assert.equal(logoSource.includes('width="523.000000pt" height="350.000000pt"'), true)
  assert.equal(brandMarkup.includes('width={523}'), true)
  assert.equal(brandMarkup.includes('height={350}'), true)
  assert.equal(logoSource.includes('viewBox="650 390 271 190"'), false)
  assert.equal(logoSource.includes('viewBox="0 0 1536.000000 1024.000000"'), false)
})

test('workspace navigation carries an icon key for every visible section', () => {
  assert.deepEqual(
    workspaceSections.map((section) => section.icon),
    ['products', 'catalog', 'schemas', 'aggregators', 'research', 'settings'],
  )
})
