import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import { join } from 'path'

describe('API Types Snapshot', () => {
  const tsConfigFilePath = join(__dirname, '../../tsconfig.json')
  const project = new Project({
    tsConfigFilePath
  })

  const filePath = join(__dirname, './api.ts')
  const sourceFile = project.addSourceFileAtPath(filePath)

  it('should match the API types snapshot', () => {
    const types = sourceFile.getTypeAliases().map((alias) => alias.getText())
    const interfaces = sourceFile.getInterfaces().map((intf) => intf.getText())

    const apiTypes = [...types, ...interfaces].join('\n\n')

    expect(apiTypes).toMatchSnapshot()
  })
})
