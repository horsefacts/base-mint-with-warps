import { FrameMetadataType, getFrameHtmlResponse } from '@coinbase/onchainkit';

export function getFrameHtml(frameMetadata: FrameMetadataType) {
  const html = getFrameHtmlResponse(frameMetadata);
  // hack: remove close tags and add aspect ratio
  const res = `${html.slice(0, html.length - 14)}<meta property="fc:frame:image:aspect_ratio" content="1:1"/></head></html>`;
  console.log(res);
  return res;
}
