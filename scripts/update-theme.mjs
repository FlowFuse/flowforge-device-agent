import * as url from 'url'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { execFileSync } from 'child_process'

// setup constants
const __dirname = url.fileURLToPath(new URL('..', import.meta.url))
const packageDirectory = __dirname
const tempDirectory = path.join(packageDirectory, 'temp')
const outputDirectory = path.join(packageDirectory, 'theme')
const outputSrcDirectory = path.join(outputDirectory, 'lib/theme')
const resources = 'resources'
const outputResourceDest = path.join(outputDirectory, resources)
const repositoryLocalRelative = '../flowforge-nr-launcher'
const repositoryLocal = path.join(packageDirectory, repositoryLocalRelative)
const repositoryUser = 'flowforge'
const repositoryName = 'flowforge-nr-launcher'
const repositoryUrl = `https://github.com/${repositoryUser}/${repositoryName}`
const repositoryPath = 'lib/theme'
let readmeFooter = 'These files were auto generated'

// Main
console.log('################################################################################')
console.log('###                             Update theme files.                          ###')
console.log('################################################################################')
await cleanUp(tempDirectory)
await cleanUp(outputDirectory)
console.log(`Checking local directory '${repositoryLocalRelative}' for theme files`)
if (existsSync(repositoryLocal)) {
    console.log('Copying theme files from local directory')
    const themeSource = path.join(repositoryLocal, repositoryPath)
    const resourceSource = path.join(repositoryLocal, resources)
    const pkg = JSON.parse(await fs.readFile(path.join(repositoryLocal, 'package.json')))
    await fs.cp(themeSource, outputSrcDirectory, { recursive: true })
    await fs.cp(resourceSource, outputResourceDest, { recursive: true })
    const hash = getGitHash(resourceSource)
    readmeFooter += ` from a local install of [${repositoryUser}/${repositoryName}](${repositoryUrl}), version: ${pkg.version}, hash: ${hash}`
} else {
    console.log('Local install not found')
    console.log(`Downloading files from '${repositoryUrl}'`)
    const hash = await download({ repositoryUrl, branch: 'main', tempDirectory, finalDirectory: outputDirectory })
    // copy files, sub folders and sub folder files to the final directory
    console.log('Copying theme files from downloaded repository')
    const themeSource = path.join(tempDirectory, repositoryPath)
    const resourceSource = path.join(tempDirectory, resources)
    await fs.mkdir(outputDirectory, { recursive: true })
    await fs.cp(themeSource, outputSrcDirectory, { recursive: true })
    if (existsSync(resourceSource)) {
        await fs.cp(resourceSource, outputResourceDest, { recursive: true })
    }
    const pkg = JSON.parse(await fs.readFile(path.join(tempDirectory, 'package.json')))
    readmeFooter += ` from [${repositoryUser}/${repositoryName}](${repositoryUrl}), version: ${pkg.version}, [${hash}](${repositoryUrl}/commit/${hash})`
}
await cleanUp(tempDirectory)
console.log('Writing README.md')
await writeReadme(outputDirectory, readmeFooter)
console.log('Writing package.json')
writePackageFile(outputDirectory)

// final clean up - remove any files that should not be in the final directory
await cleanUp(path.join(outputSrcDirectory, 'scripts'))
await cleanUp(path.join(outputSrcDirectory, 'README.md'))
await cleanUp(path.join(outputSrcDirectory, 'forge-light/forge-light-theme.scss'))
await cleanUp(path.join(outputSrcDirectory, 'forge-dark/forge-dark-theme.scss'))

// done
console.log('Theme files updated')
console.log('################################################################################')

async function writeReadme (dir, footer) {
    const readmePath = path.join(dir, 'README.md')
    const readme = []
    readme.push('**DO NOT MODIFY THESE FILES DIRECTLY**\n\n')
    readme.push('This directory contains the flowforge theme files for Node-RED\n\n')
    readme.push('All files in this directory are generated by the script `scripts/update_theme.js`\n\n')
    readme.push('To update the theme, run `npm run update-theme`\n\n')
    if (footer) {
        readme.push(footer)
    }
    readme.push('\n')
    await fs.writeFile(readmePath, readme)
}

async function writePackageFile (dir) {
    const packagePath = path.join(dir, 'package.json')
    const pkgData = {
        name: '@flowforge/flowforge-nr-theme',
        version: '0.0.0',
        description: 'FlowForge themes for Node-RED',
        info: 'This package was generated by the script `flowforge-device-agent/scripts/update_theme.mjs`',
        license: 'Apache-2.0',
        'node-red': {
            version: '>=2.2.0',
            plugins: {
                'forge-light': 'lib/theme/forge-light/forge-light.js',
                'forge-dark': 'lib/theme/forge-dark/forge-dark.js'
            }
        },
        engines: {
            node: '>=16.x'
        }
    }
    await fs.writeFile(packagePath, JSON.stringify(pkgData, null, 4))
}
async function cleanUp (path) {
    if (!existsSync(path)) return
    // if it is a file, delete it using fs.unlink otherwise use fs.rm
    const stat = await fs.stat(path)
    if (stat.isFile()) {
        await fs.unlink(path)
        return
    }
    await fs.rm(path, { recursive: true })
}

function git (cwd, ...args) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'ignore' })
}

async function download ({ repositoryUrl, branch = 'master', repositoryPath = '.', tempDirectory, finalDirectory }) {
    if (!existsSync(tempDirectory)) {
        git(null, 'clone', '--filter=blob:none', '--no-checkout', repositoryUrl, tempDirectory)
        // git(tempDirectory, 'sparse-checkout', 'init', '--cone')
        // git(tempDirectory, 'sparse-checkout', 'set', repositoryPath)
    }
    git(tempDirectory, '-c', 'advice.detachedHead=false', 'checkout', branch)
    git(tempDirectory, 'pull', 'origin', branch)
    return getGitHash(tempDirectory)
}

function getGitHash (dir) {
    try {
        return git(dir, 'rev-parse', 'HEAD').trim()
    } catch (error) {
        return 'unknown'
    }
}
