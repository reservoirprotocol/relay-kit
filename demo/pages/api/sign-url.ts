import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

type ResponseData = {
  signature: null | string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { url: _url, ...query } = req.query

  const url = new URL(_url as string)

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value as string)
  }

  if (!url) {
    res.status(400).json({ signature: null })
    return
  }
  const signature = crypto
    .createHmac('sha256', process.env.NEXT_MOONPAY_SECRET!)
    .update(url.search)
    .digest('base64')

  res
    .status(200)
    .setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=60'
    )
    .json({ signature })
}
