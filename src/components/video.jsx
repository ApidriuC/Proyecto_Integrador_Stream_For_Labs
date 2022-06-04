import react, { useEffect, useRef } from "react";

const Video = ({ url }) => {
  
    const videoRef = useRef();
    const previousUrl = useRef(url);

  useEffect(() => {
    if (previousUrl.current !== url && videoRef.current) {
        videoRef.current.load();
        previousUrl.current = url;
    }
  }, [url]);

  return (
    <video width="60%" height="50%" controls ref={videoRef}>
      <source src={url} />
    </video>
  );
};

export default Video;
