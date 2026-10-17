import { writeFileSync } from "node:fs";
const specs = { InstrumentSerif: "Instrument+Serif:ital@0;1", Geist: "Geist:wght@400;500", GeistMono: "Geist+Mono:wght@400;500" };
for (const [name, spec] of Object.entries(specs)) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${spec}`, { headers: { "User-Agent": "Wget/1.0" } })).text();
  for (const block of css.split("@font-face").slice(1)) {
    const style = block.match(/font-style: (\w+)/)[1];
    const weight = block.match(/font-weight: (\d+)/)[1];
    const url = block.match(/url\((.+?)\)/)[1];
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const file = `fonts/${name}-${weight}${style === "italic" ? "i" : ""}.ttf`;
    writeFileSync(file, buf);
    console.log(file, buf.length);
  }
}
