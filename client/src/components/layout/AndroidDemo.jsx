import { Android } from "../ui/android";


export function AndroidDemo() {
  return (
    <div className="relative  max-sm:mt-10  sm:-rotate-90">
      <Android
        className="size-full text-center  "
        videoSrc="https://cdn.pixabay.com/video/2019/08/07/25850-352978454_large.mp4"
      />
    </div>
  )
}
