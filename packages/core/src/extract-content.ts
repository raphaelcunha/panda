import { Stylesheet } from '@css-panda/atomic'
import { createCollector, createPlugins, transformFileSync } from '@css-panda/parser'
import { InternalContext } from './create-context'
import { createDebug } from './debug'

export function extractContent(ctx: InternalContext, file: string) {
  const { hash, importMap } = ctx

  const sheet = new Stylesheet(ctx.context(), { hash })
  const collector = createCollector()

  transformFileSync(file, {
    plugins: createPlugins(collector, importMap, file),
  })

  collector.globalStyle.forEach((result) => {
    sheet.processObject(result.data)
  })

  collector.fontFace.forEach((result) => {
    sheet.processFontFace(result)
  })

  collector.css.forEach((result) => {
    sheet.process(result)
  })

  collector.cssMap.forEach((result) => {
    for (const data of Object.values(result.data)) {
      sheet.process({ type: 'object', data })
    }
  })

  collector.recipe.forEach((result, name) => {
    for (const item of result) {
      sheet.processRecipe(ctx.recipes[name], item.data)
    }
  })

  if (collector.isEmpty()) return

  const tempPath = ctx.temp.write(file, sheet.toCss())
  createDebug('temp:write', tempPath)

  sheet.reset()
}