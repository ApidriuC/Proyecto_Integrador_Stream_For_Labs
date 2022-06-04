/* eslint-disable jsx-a11y/anchor-is-valid */
import react, { useContext, useState, useEffect } from "react";
import { logout } from "../util/auth";
import "../styles/header.css";
import { upload } from "../services/fileApiService";
import withMessage from "../hocs/withMessage";
import { getMaxStorageAvailable } from "../services/fileApiService";
import { removeFiles } from "../services/fileApiService";
import { removeVideos } from "../services/videoApiService";
import { removePhotos } from "../services/photoApiService";
import { getStorageUsed } from "../services/fileApiService";
import { AppContext } from "../context/AppProvider";
import axios from "axios";
import { useLocation } from "react-router-dom";
import isElectron from "is-electron";
import { saveFileWithSync } from "../services/fileApiService";

const GB = 1000000000; //numero de bytes que tiene 1GB
const { ipcRenderer } = window;

const Header = ({ noIsAdminSection = true, showMessage }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("0%");
  const context = useContext(AppContext);
  const selectingFilesToRemove = context[4];
  const setSelectingFilesToRemove = context[5];
  const filesToRemove = context[6];
  const setReloadFiles = context[9];
  const [allowCancelUpload, setAllowCancelUpload] = useState(false);
  const cancelSource = react.useRef(null);
  const location = useLocation();

  useEffect(() => {
    console.log("RENDER HEADER!");
  }, [location]);

  const onUploadProgress = (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    setProgress(`${percentCompleted}%`);
  };

  const onRemove = () => {
    // si son videos
    console.log("To remove -> ", filesToRemove);
    if (filesToRemove.type === "video") {
      removeVideos(filesToRemove.data)
        .then(() => {
          showMessage("Video(s) removed!");
          setSelectingFilesToRemove(false);
          setReloadFiles(true);
        })
        .catch((err) => showMessage(err.message, "error"));
    } else if (filesToRemove.type === "file") {
      // si son archivos
      removeFiles(filesToRemove.data)
        .then(() => {
          showMessage("File(s) removed!");
          setSelectingFilesToRemove(false);
          setReloadFiles(true);
        })
        .catch((err) => showMessage(err.message, "error"));
    } else {
      // si son fotos
      removePhotos(filesToRemove.data)
        .then(() => {
          showMessage("Photo(s) removed!");
          setSelectingFilesToRemove(false);
          setReloadFiles(true);
        })
        .catch((err) => showMessage(err.message, "error"));
    }
  };

  const getMaxStorage = () => {
    return new Promise((resolve, reject) => {
      getMaxStorageAvailable()
        // Get max user storage (GB)
        .then((res) => {
          const maxStorage = res.data.maxStoraged;
          resolve(maxStorage);
        })
        .catch((err) => reject(err));
      resolve(5);
    });
  };

  const getUserStorageUsed = () => {
    return new Promise((resolve, reject) => {
      getStorageUsed()
        // Obtiene el espacio de alamacenamiento ocupado por el usuario
        .then((res) => {
          resolve(res.data.storageUsed / GB);
        })
        .catch((err) => reject(err));
    });
  };

  const verifyStorage = (fileSize) => {
    return new Promise((resolve, reject) => {
      Promise.all([getMaxStorage(), getUserStorageUsed()])
        .then((results) => {
          const maxSize = results[0];
          const userStorageUsed = results[1];
          const newSizeToStorage = fileSize / GB;
          if (userStorageUsed + newSizeToStorage > maxSize) {
            showMessage(
              `Storage exceeded, you have available: ${
                maxSize - userStorageUsed
              }GB`,
              "error"
            );
            resolve(false);
            setUploading(false);
          } else {
            resolve(true);
          }
        })
        .catch((err) => reject(err));
    }).catch((err) => showMessage(err.message, "error"));
  };

  const handleCancel = () => {
    setUploading(false);
    cancelSource.current.cancel("Operation canceled by the user.");
  };

  const handleFile = (e) => {
    setAllowCancelUpload(false);
    const file = e.target.files[0];
    if (file) {
      setProgress("0%");
      setUploading(true);

      // if have storage upload the file
      verifyStorage(file.size)
        .then((haveStorage) => {
          if (haveStorage) {
            const formData = new FormData();
            formData.append("file", file);

            let type = "File";
            if (file.type.includes("video")) type = "Video";
            else if (file.type.includes("image")) type = "Photo";

            cancelSource.current = axios.CancelToken.source();
            setAllowCancelUpload(true);
            upload(formData, onUploadProgress, cancelSource.current.token)
              .then((res) => {
                if (
                  res.data?.error?.message?.includes(
                    "E11000 duplicate key error"
                  )
                ) {
                  showMessage(`The file exist`, "warning");
                  setUploading(false);
                  setReloadFiles(true);
                  setAllowCancelUpload(false);
                } else {
                  setUploading(false);
                  showMessage(`${type} uploaded!`);
                  setReloadFiles(true);
                  setAllowCancelUpload(false);
                }
              })
              .catch(function (thrown) {
                if (axios.isCancel(thrown)) {
                  showMessage("Upload canceled", "warning");
                  setAllowCancelUpload(false);
                } else {
                  // handle error
                  console.error(thrown);
                  setUploading(false);
                  showMessage(thrown.message, "error");
                  setAllowCancelUpload(false);
                }
              });
          }
        })
        .catch((err) => {
          console.error(err);
          setUploading(false);
          showMessage(err.message, "error");
        });
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm fixed-top">
      <div className="container-fluid d-flex flex-row-reverse">
        <div>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {selectingFilesToRemove && (
              <>
                <li className="nav-item mr-2">
                  <button
                    className="btn btn-outline-danger btn-sm mt-1"
                    onClick={onRemove}
                  >
                    <i className="far fa-trash-alt"></i> Remove
                  </button>
                </li>
                <li className="nav-item mr-2">
                  <button
                    className="btn btn-outline-secondary btn-sm mt-1"
                    onClick={() => setSelectingFilesToRemove(false)}
                  >
                    Cancel
                  </button>
                </li>
              </>
            )}
            {noIsAdminSection && (
              <li className="nav-item mr-2">
                <form>
                  <input
                    disabled={uploading}
                    onChange={handleFile}
                    name="file"
                    type="file"
                    id="file"
                    className="inputfile"
                  />
                  {uploading ? (
                    <button
                      className="btn btn-outline-danger btn-sm mt-1"
                      onClick={handleCancel}
                      type="button"
                      disabled={!allowCancelUpload}
                    >
                      {progress} : Cancel
                    </button>
                  ) : (
                    <>
                      {!selectingFilesToRemove &&
                        (location.pathname === "/" ||
                          location.pathname === "/videos" ||
                          location.pathname === "/photos") && (
                          <label htmlFor="file">
                            <i className="fas fa-file-upload"></i> Upload
                          </label>
                        )}
                    </>
                  )}
                </form>
              </li>
            )}
            <li className="nav-item">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  logout();
                  if (isElectron()) {
                    ipcRenderer.send("desynchronize", null);
                  }
                }}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </li>
          </ul>
        </div>
        <div>
          <div className="d-flex flex-row">
            <a className="navbar-brand" href="/">
              <i
                className="fas fa-database"
                style={{ color: "#48dbfb", fontSize: 30 }}
              ></i>
            </a>
            <span>
              <h5 className="pt-2">Streams for lab</h5>
            </span>
          </div>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default withMessage(Header);
