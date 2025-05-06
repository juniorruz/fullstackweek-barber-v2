import { useEffect, useState } from "react"

const useMediaQuery = (width: number) => {
  const [isWide, setIsWide] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsWide(window.innerWidth > width)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [width])

  return isWide
}

export default useMediaQuery
