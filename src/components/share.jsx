import React, { useState, useEffect, useRef, useContext } from "react";
import { getUsuarios } from "../services/fileApiService";
import { Typeahead } from "react-bootstrap-typeahead";
import { shareFile } from "../services/fileApiService";
import { sharePhoto } from "../services/photoApiService";
import { shareVideo } from "../services/videoApiService";
import WithMessage from "../hocs/withMessage";
import { AppContext } from "../context/AppProvider";

const Modal = ({ showMessage, file }) => {
  const refContainer = useRef();
  const [users, setUsers] = useState([]);
  const [singleSelections, setSingleSelections] = useState([]);
  const context = useContext(AppContext);
  const user = context[3];
  const listUsuarios = () => {
    getUsuarios().then((res) => {
      const listusers = res.data.filter(us => us.username.replace(/\s/g, "-").toLowerCase() !== user.username);
      setUsers(listusers);
    });
  };

  const resetTypeAhead = () => {
    setSingleSelections([]);
  };

  useEffect(() => {
    listUsuarios();
  }, [file]);

  const onShare = (file, user) => {
    if (!file.shared_users.includes(user._id)) {
      if (file.type == "file") {
        shareFile(file._id, user._id)
          .then((res) => {
            if (res.data) {
              resetTypeAhead();
              showMessage("File shared!");
            }
          })
          .catch((err) => showMessage(err.message, "error"));
      } else if (file.type == "photo") {
        sharePhoto(file._id, user._id)
          .then((res) => {
            if (res.data) {
              resetTypeAhead();
              showMessage("Photo shared!");
            }
          })
          .catch((err) => showMessage(err.message, "error"));
      } else {
        shareVideo(file._id, user._id)
          .then((res) => {
            if (res.data) {
              resetTypeAhead();
              showMessage("Video shared!");
            }
          })
          .catch((err) => showMessage(err.message, "error"));
      }
    } else {
      showMessage("User already has file shared", "warning");
    }
  };

  return (
    <div
      className="modal"
      id="ventanaModalShared"
      tabindex="-1"
      role="dialog"
      aria-labelledby="tituloVentana"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5>Share With Users</h5>
          </div>
          <div className="modal-body">
            <div className="input-group">
              <div className="input-group-pretend mr-1">
                <span className="input-group-text">
                  <i style={{ fontSize: 20 }} className="fas fa-user-plus"></i>
                </span>
              </div>

              <Typeahead
                id="users-typeahead"
                labelKey="username"
                onChange={setSingleSelections}
                options={users}
                placeholder="Select users..."
                selected={singleSelections}
                ref={refContainer}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-warning"
              type="button"
              data-dismiss="modal"
              onClick={() => {
                refContainer.current.clear();
                setSingleSelections([]);
              }}
            >
              Close
            </button>

            <button
              disabled={singleSelections.length == 0}
              className="btn btn-success"
              arial-label="Compartir"
              data-dismiss="modal"
              onClick={() =>
                onShare(file, singleSelections[0], refContainer.current.clear())
              }
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithMessage(Modal);
