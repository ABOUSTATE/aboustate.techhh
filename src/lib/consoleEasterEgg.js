export function printConsoleEasterEgg() {
  const art = `
   ▄▄▄ ▄▄  ▄▄▄  ▄▄  ▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  ▐███ ██ ▐███▌ ██ ██ ██ ▄▄ █ ██ ▄▄ ██ ▄▄ █
  ▐███ ██ ██ ██ ██ ██ ██ ██ █ ██ ▀▀ ██ ▀▀ █
   ▀▀▀ ▀▀ ▀▀ ▀▀ ▀▀▀▀▀ ▀▀▀▀▀▀▀ ▀▀ ▀▀▀▀ ▀▀▀▀▀
`;
  console.log(
    "%c" + art,
    "color: #90b495; font-family: monospace; font-weight: bold;"
  );
  console.log(
    "%cNarrative, compiled.",
    "color: #02362f; font-family: monospace; font-size: 14px; font-weight: bold;"
  );
  console.log(
    "%cPoking around the source? We like that.\nWe're always open to hearing from people who build things well: studio@aboustate.tech",
    "color: #4c706a; font-family: monospace; font-size: 12px;"
  );
}
