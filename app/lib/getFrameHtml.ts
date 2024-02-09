import { FrameMetadataType, getFrameHtmlResponse } from '@coinbase/onchainkit';

export function getFrameHtml(frameMetadata: FrameMetadataType) {
  const html = getFrameHtmlResponse(frameMetadata);

  const extraTags = [
    '<meta property="og:title" content="Farcaster: Horse">',
    '<meta property="og:description" content="Farcaster Protocol Release">',
    '<meta property="og:image" content="https://mint.farcaster.xyz/api/images/start">',
    '<meta property="fc:frame:image:aspect_ratio" content="1:1" />',
  ];
  // hack: remove close tags, add aspect ratio and required OG tags
  return `${html.slice(0, html.length - 14)}${extraTags.join('')}</head></html>`;
}
