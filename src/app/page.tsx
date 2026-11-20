import Image from "next/image";
import HeroImage from '../../public/hero.png'

export default function Home() {
  return (
    <>
      <Image
        src={HeroImage}
        alt="Hero image"
      ></Image>
    </>
  );
}
