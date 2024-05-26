/**
 * @copyright OpenISP Cooperative
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Build JSON schemas for distribution.
 */

import { repoRootPathBuilder, runIfScript } from "@openisp.coop/node"
import FastGlob from "fast-glob"
import * as fs from "node:fs/promises"
import * as path from "node:path"

const schemaDirectoryPath = repoRootPathBuilder("schema.isp.nexus", "json")
const distPath = repoRootPathBuilder("schema.isp.nexus", "dist")

const schemaPaths = await FastGlob.async([repoRootPathBuilder(schemaDirectoryPath, "*.json")], {
	ignore: ["**/*.openapi.json"],
})

async function prepareJSONSchemaDistribution() {
	await fs.rm(distPath, { recursive: true, force: true })
	await fs.mkdir(distPath, { recursive: true })

	await Promise.all(
		schemaPaths.map(async (schemaPath) => {
			const relativePath = path.relative(schemaDirectoryPath, schemaPath)
			const schemaID = path.parse(relativePath).name

			await Promise.all([
				// First, we copy the file relative to the distribution directory.
				fs.copyFile(schemaPath, path.join(distPath, relativePath)),
				// Then we do it again but with the schemaID as the filename to aid in simple lookups.
				fs.copyFile(schemaPath, path.join(distPath, schemaID)),
			])
		})
	)

	await fs.writeFile(path.join(distPath, "index.json"), JSON.stringify(schemaPaths, null, 2))
	await fs.writeFile(
		path.join(distPath, "_headers"),
		[
			"# Cloudflare Pages header configuration",
			"/*",
			"Access-Control-Allow-Origin: *",
			"Content-Type: application/schema+json",
			"",
		].join("\n")
	)
}

await runIfScript(import.meta, prepareJSONSchemaDistribution)
