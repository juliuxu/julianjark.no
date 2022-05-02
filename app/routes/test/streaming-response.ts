import { LoaderFunction } from "@remix-run/node";
import Stream from "stream";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const responseStreamFromGenerator = () => {
  // From generator
  async function* generate() {
    yield "hello\n";
    await sleep(1000);
    yield "world\n";
    await sleep(1000);
    yield "and\n";
    await sleep(700);
    yield "good night\n";
  }
  const stream = Stream.Readable.from(generate());

  return new Response(stream as any, {
    status: 200,
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};

const responseStreamFromSomethingThatICanPushTo = () => {
  const stream = new Stream.PassThrough();

  (async () => {
    stream.write("hello\n");
    await sleep(1000);
    stream.write("world\n");
    await sleep(1000);
    stream.write("and\n");
    await sleep(700);
    stream.write("good night\n");
    stream.end();
  })();

  return new Response(stream as any, {
    status: 200,
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};

export const loader: LoaderFunction = () => {
  // return responseStreamFromGenerator();
  return responseStreamFromSomethingThatICanPushTo();
};
