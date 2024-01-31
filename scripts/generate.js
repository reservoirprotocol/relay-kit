/**
 * DO NOT RUN THIS FILE MANUALLY - 
 * Run `bun package:change` to first generate a base changeset file. 
 * This script will then append your commits to that changeset for a more descriptive update.
 */

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

const handleError = (error) => {
  if (error) throw error
}

exec('git rev-parse --abbrev-ref HEAD', (error, stdout, stderr) => {
  handleError(error)
  handleError(stderr)

  exec(
    `git log main..${stdout.trim()} --pretty=format:%s`,
    (logError, logStdout, logStderr) => {
      handleError(logStderr)
      handleError(logError)

      fs.readdir('.changeset', (dirErr, files) => {
        handleError(dirErr)

        const mdFile = files.find((file) => file.endsWith('.md'))
        if (mdFile) {
          const filePath = path.join('.changeset', mdFile)
          fs.readFile(filePath, 'utf8', (readErr, data) => {
            handleError(readErr)

            const commitLines = logStdout
              .split(/(?=feat:|fix:|chore:)/g)
              .filter(Boolean)
              .join('\n')

            console.log(commitLines)
            const updatedContent = `${data}\n\n${commitLines}`

            fs.writeFile(filePath, updatedContent, 'utf8', (writeErr) => {
              handleError(writeErr)
              console.info(`Commit messages have been appended to ${filePath}`)
            })
          })
        } else {
          handleError(
            new Error(`No changeset file found in .changesets directory`)
          )
        }
      })
    }
  )
})
