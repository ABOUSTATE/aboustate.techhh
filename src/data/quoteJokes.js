export const QUOTE_JOKES = [
  "“We'll fix it in post” — famous last words of every producer, ever.",
  "Client: “Can you make the logo bigger?” Designer: *dies a little inside*.",
  "“Just one more round of revisions” has ended more careers than it should.",
  "A brand without a style guide is just a company having an identity crisis in public.",
  "“Can we get it by tomorrow?” said the client who sat on the brief for six weeks.",
  "Color grading: the art of making Tuesday's footage look like a Tuesday in Tuscany.",
  "“Make it pop” is not feedback. It's a dare.",
  "Behind every great campaign is an editor who hasn't slept since Thursday.",
  "“We want it to go viral” — a brief with no budget, attached to infinite expectations.",
  "Render times: the only meditation practice a video editor has time for.",
  "A good tagline takes five minutes to write and three weeks to approve.",
  "“Can you send the raw files?” is the agency equivalent of asking to see the recipe AND the kitchen.",
  "The font is Helvetica. It was always going to be Helvetica.",
  "Nothing says “urgent” like an email sent at 11:58pm on a Friday.",
  "A storyboard is just a comic book nobody's allowed to enjoy.",
];

export function getRandomQuoteJoke() {
  return QUOTE_JOKES[Math.floor(Math.random() * QUOTE_JOKES.length)];
}
