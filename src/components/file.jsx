import React, { Component, useContext, useEffect, useState } from "react";
import "../styles/fileComponent.css";
import moment from "moment";
import Spinner from "./spinner";
import { downloadFile } from "../services/fileApiService";
import { downloadPhoto } from "../services/photoApiService";
import { downloadVideo } from "../services/videoApiService";
import WithMessage from "../hocs/withMessage";
import { AppContext } from "../context/AppProvider";
import Modal from "./share";
import $ from "jquery";

const File = ({
  loading = true,
  dirs = [],
  files = [],
  isSharedSection = false,
  onSelectedFile,
  showMessage,
  onSort,
  backDirectory,
}) => {
  const [currentFile, setCurrentFile] = useState([]);
  const context = useContext(AppContext);
  const selectingFilesToRemove = context[4];
  const setSelectingFilesToRemove = context[5];
  const filesToRemove = context[6];
  const SetFilesToRemove = context[7];
  const arrowStyle = { fontSize: 30, color: "#3498db" };

  useEffect(() => {
    // Remove files from lis to remove
    if (!selectingFilesToRemove) {
      SetFilesToRemove({ type: "", data: [] });
      const checkboxes = document.getElementsByClassName("form-check-input");
      for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
      }
    }
  }, [selectingFilesToRemove]);

  const calSize = (bytes) => {
    const GB = 1000000000; //numero de bytes que tiene 1GB
    const MG = 1048576; //numero de bytes que tiene 1MG
    const KB = 1024; //numero de bytes que tiene 1KB

    // Gigabytes
    if (bytes >= GB) {
      return `${(bytes / GB).toFixed(2)} GB`;
    } else if (bytes >= MG) {
      //Megabytes/
      return `${(bytes / MG).toFixed(2)} MB`;
    } else {
      // Kilobytes/
      return `${(bytes / KB).toFixed(2)} KB`;
    }
  };

  const formatDate = (date) => {
    const format = "lll";
    const upload_at = moment(date).format(format);
    return moment(upload_at, format).fromNow();
  };

  const onDownload = (file) => {
    showMessage("Download started");

    if (file.type === "file") {
      downloadFile(file._id)
        .then((res) => {
          const blob = res.data;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", file.name);
          link.click();
          showMessage("File downloaded!");
        })
        .catch((err) => showMessage(err.message, "error"));
    } else if (file.type === "photo") {
      downloadPhoto(file._id)
        .then((res) => {
          const blob = res.data;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", file.name);
          link.click();
          showMessage("Photo downloaded!");
        })
        .catch((error) => {
          showMessage(error.message, "error");
        });
    } else {
      downloadVideo(file._id)
        .then((res) => {
          const blob = res.data;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", file.name);
          link.click();
          showMessage("Video downloaded!");
        })
        .catch((error) => {
          showMessage(error.message, "error");
        });
    }
  };

  const handleCheckFile = (e, file) => {
    const checked = e.target.checked;
    const currentFilesToremove = filesToRemove.data;

    // Ad file to remove list
    if (checked) {
      currentFilesToremove.push(file._id);
      SetFilesToRemove({
        type: file.type,
        data: currentFilesToremove,
      });
      setSelectingFilesToRemove(true);
    } else {
      // Remove file from remove list
      currentFilesToremove.splice(currentFilesToremove.indexOf(file), 1);
      SetFilesToRemove({
        type: file.type,
        data: currentFilesToremove,
      });
    }

    // if check is 0 cancel remove action
    if (filesToRemove.data.length === 0) setSelectingFilesToRemove(false);
  };

  const onShare = (file) => {
    console.log(file);
    setCurrentFile(file);
    $("#ventanaModalShared").modal("show");
  };

  return (
    <div className="container-fluid mb-5">
      {dirs.children && (
        <div className="my-2">
          <button
            onClick={backDirectory}
            disabled={dirs.dir === "Home"}
            className=" btn btn-default"
          >
            <i style={arrowStyle} className="fas fa-arrow-circle-left"></i>
          </button>
          | {dirs.dir}
        </div>
      )}

      <div className="row border py-2 mx-3">
        <div className={`col-${isSharedSection ? "3" : "5"}`}>
          <span onClick={() => onSort("name")} className="sort">
            Name <i className="fas fa-caret-down"></i>
          </span>
        </div>
        <div className="sort" className="col-2">
          <span
            onClick={dirs.length === 0 ? () => onSort("date") : null}
            className="sort"
          >
            Date <i className="fas fa-caret-down"></i>
          </span>
        </div>
        <div className="col-2">
          Size <i className="fas fa-caret-down"></i>
        </div>
        {isSharedSection && (
          <div className="col-3">
            Shared from <i className="fas fa-caret-down"></i>
          </div>
        )}
      </div>
      {!loading && (
        <div>
          {files.length != 0 &&
            files.map((file, key) => (
              <div key={key} className="row mx-3 file container">
                <div
                  onClick={() => (onSelectedFile ? onSelectedFile(file) : "")}
                  className={`my-2 col-${
                    isSharedSection ? "3" : "5"
                  } form-check`}
                >
                  {!isSharedSection && !file.sync && (
                    <input
                      onChange={(e) => handleCheckFile(e, file)}
                      className="form-check-input"
                      type="checkbox"
                    />
                  )}
                  <label className="form-check-label">
                    <i className="far fa-file-alt mr-2"></i>
                    {file.name.length > 25
                      ? file.name.substring(0, 25) + "..."
                      : file.name}
                  </label>
                </div>
                <div
                  onClick={() => (onSelectedFile ? onSelectedFile(file) : "")}
                  className="col-2 my-2"
                >
                  {formatDate(file.upload_at)}
                </div>
                <div
                  onClick={() => (onSelectedFile ? onSelectedFile(file) : "")}
                  className="col-2 my-2"
                >
                  {calSize(file.weight)}
                </div>
                {isSharedSection && (
                  <div
                    onClick={() => (onSelectedFile ? onSelectedFile(file) : "")}
                    className="col-3 my-2"
                  >
                    {file.author.length > 25
                      ? file.author.username.substring(0, 25) + "..."
                      : file.author.username}
                  </div>
                )}
                <div className={`col-${isSharedSection ? "2" : "3"}`}>
                  <div className="d-flex flex-row-reverse ">
                    <div className="btn-group dropleft">
                      <button
                        type="button"
                        className="btn btn-default dropdown-toggle"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i
                          style={{ fontSize: 20 }}
                          className="fas fa-chevron-circle-down dropdown show ml-auto"
                        ></i>
                      </button>
                      <div className="dropdown-menu">
                        <button
                          onClick={() => onDownload(file)}
                          className="dropdown-item  btn btn-link"
                        >
                          <i className="fas fa-cloud-download-alt"></i> Download
                        </button>
                        {!isSharedSection && (
                          <button
                            onClick={() => onShare(file)}
                            className="dropdown-item btn btn-link"
                          >
                            <i className="fas fa-share-alt"></i> Share
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {dirs.children?.length !== 0 &&
            dirs.children?.map((dir, key) => (
              <div key={key} className="row mx-3 file container">
                <div
                  onClick={() =>
                    onSelectedFile && dir.children.length != 0
                      ? onSelectedFile(dir)
                      : ""
                  }
                  className={`my-2 col-${
                    isSharedSection ? "3" : "5"
                  } form-check`}
                >
                  {dir.children.length == 0 && !dir.file.sync && (
                    <input
                      onChange={(e) => handleCheckFile(e, dir.file)}
                      className="form-check-input"
                      type="checkbox"
                    />
                  )}
                  <label className="form-check-label">
                    {dir.children.length != 0 && (
                      <i className="far fa-folder mr-2"></i>
                    )}

                    {dir.children.length === 0 && (
                      <>
                        {dir.file.type === "photo" && (
                          <i className="far fa-file-image mr-2"></i>
                        )}
                        {dir.file.type === "video" && (
                          <i className="far fa-file-video mr-2"></i>
                        )}
                        {dir.file.type === "file" && (
                          <i className="far fa-file-alt mr-2"></i>
                        )}
                      </>
                    )}

                    {dir.children.length === 0
                      ? dir.file.name.length > 25
                        ? dir.file.name.substring(0, 25) + "..."
                        : dir.file.name
                      : dir.dir}
                  </label>
                </div>
                <div
                  onClick={() =>
                    onSelectedFile && dir.children.length != 0
                      ? onSelectedFile(dir)
                      : ""
                  }
                  className="col-2 my-2"
                >
                  {dir.children.length == 0
                    ? formatDate(dir.file.upload_at)
                    : "Without date"}
                </div>
                <div
                  onClick={() =>
                    onSelectedFile && dir.children.length != 0
                      ? onSelectedFile(dir)
                      : ""
                  }
                  className="col-2 my-2"
                >
                  {dir.children.length == 0
                    ? calSize(dir.file.weight)
                    : dir.children.length + " items"}
                </div>

                <div className={`col-${isSharedSection ? "2" : "3"}`}>
                  <div className="d-flex flex-row-reverse ">
                    {dir.children.length == 0 && (
                      <div className="btn-group dropleft">
                        <button
                          type="button"
                          className="btn btn-default dropdown-toggle"
                          data-toggle="dropdown"
                          aria-haspopup="true"
                          aria-expanded="false"
                        >
                          <i
                            style={{ fontSize: 20 }}
                            className="fas fa-chevron-circle-down dropdown show ml-auto"
                          ></i>
                        </button>

                        <div className="dropdown-menu">
                          <>
                            <button
                              onClick={() => onDownload(dir.file)}
                              className="dropdown-item  btn btn-link"
                            >
                              <i className="fas fa-cloud-download-alt"></i>{" "}
                              Download
                            </button>
                            <button
                              onClick={() => onShare(dir.file)}
                              className="dropdown-item btn btn-link"
                            >
                              <i className="fas fa-share-alt"></i> Share
                            </button>
                          </>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      {loading && (
        <div className="d-flex flex-row justify-content-center mt-5">
          <Spinner />
        </div>
      )}
      {!loading && files.length == 0 && dirs.children?.length == 0 && (
        <p className="text-center text-muted my-5">Start to share files!</p>
      )}
      {!loading && files.length == 0 && !dirs.children && (
        <p className="text-center text-muted my-5">Start to share files!</p>
      )}
      {/* <Modal/> */}
      <div>
        <Modal file={currentFile} />
      </div>
    </div>
  );
};

export default WithMessage(File);
