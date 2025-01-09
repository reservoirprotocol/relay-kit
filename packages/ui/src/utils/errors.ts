export const errorToJSON = (error: any) => {
  if (!(error instanceof Error)) {
    return error
  }
  try {
    return JSON.stringify({
      //@ts-expect-error
      name: error.name,
      //@ts-expect-error
      message: error.message,
      stack: error.stack,
      ...error
    })
  } catch (e) {
    return error
  }
}
