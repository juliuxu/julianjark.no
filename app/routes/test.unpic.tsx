import { Image } from "@unpic/react";

import { unpicTransformer } from "~/utils";

const vargUrl =
  "https://www.notion.so/image/https%3A%2F%2Fs3.us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fdfc44bd3-7ec3-4d45-a96a-03abdbba0898%2FIMG_3203.jpeg?table=block&id=2acd63e6-75f8-4b06-bc47-f17be36cae93&cache=v2";
export default function Component() {
  return (
    <div>
      <p>{vargUrl}</p>
      <Image
        transformer={unpicTransformer}
        src={vargUrl}
        layout="constrained"
        width={800}
        height={1200}
        alt="Varg"
        background="auto"
      />
    </div>
  );
}
