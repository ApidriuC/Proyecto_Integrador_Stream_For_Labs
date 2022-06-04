import { onSort } from "../util/sort";
import WithMessage from "../hocs/withMessage";
import WithAppLayout from "../layouts/appLayout";
import FileComponent from "../components/file";
import { useEffect, useState, useContext, Fragment } from "react";
import { listVideos } from "../services/videoApiService";
import { AppContext } from "../context/AppProvider";
import Video from '../components/video'


const Videos = ({ showMessage }) => {
  const [videos, SetVideos] = useState([]);

  const context = useContext(AppContext);
  const reloadFiles = context[8];
  const setReloadFiles = context[9];
  const [loadingVideos, setloadingVideos] = useState(true);
  const [currentVideo, setCurrentVideo] = useState({});
  const handleSort = async (typeSort) => {
    const sortFiles = await onSort(typeSort, [...videos]);
    SetVideos(sortFiles);
  };

  const handleSelecFile = (fileSelected) => {
    setCurrentVideo(fileSelected);
  };

  function getVideos() {
    listVideos()
      .then((res) => {
        const videos = res.data;
        SetVideos(videos);
        setReloadFiles(false);

        if (videos.length != 0) {
          setCurrentVideo(videos[0]);
        } else {
          setCurrentVideo({});
        }
        setloadingVideos(false);
      })
      .catch((error) => {
        showMessage(error.message, "error");
        setReloadFiles(false);
        setloadingVideos(false);
      });
  }

  useEffect(() => {
    getVideos();
  }, [reloadFiles]);

  return (
    <div>
      <div className="d-flex flex-row justify-content-center mt-2">
        {videos.length !== 0 && currentVideo && (
         <Video url = {`${process.env.REACT_APP_VIDEO_HOST}/api/video/download/${currentVideo._id}`}/>
        )}
      </div>
      <div className="mt-2">
        {videos.length !== 0 && (
          <Fragment>
            <h4 className="my-1 text-center mx-2">{currentVideo.name}</h4>
            <p className="text-muted text-center">Play list</p>
          </Fragment>
        )}
      </div>
      <FileComponent
        loading={loadingVideos}
        files={videos}
        onSelectedFile={handleSelecFile}
        onSort={handleSort}
      />
    </div>
  );
};

export default WithMessage(WithAppLayout(Videos));
