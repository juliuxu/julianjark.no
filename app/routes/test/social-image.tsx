import { socialImageUrlBuilder } from "../api/social-image";

export default function SocialImageTest() {
  const imageUrl = socialImageUrlBuilder({
    headline: "I dag lærte jeg",
    title: "Bryte opp ord med bindestrek for mindre skjermer",
    tags: [{ title: "html", color: "rgb(187 247 208)" }],
    author: "Julian Jark",
  });
  return (
    <div>
      <img style={{ maxWidth: "100%" }} alt="" src={imageUrl.toString()} />
    </div>
  );
}
