import React, { useContext, useEffect, useState } from "react";
import "../styles/shared.css";
import { onSort } from '../util/sort'
import WithMessage from "../hocs/withMessage";
import WithAppLayout from "../layouts/appLayout";
import { getSharedFiles } from '../services/fileApiService'
import FileComponent from "../components/file";
import { AppContext } from '../context/AppProvider';


  const Shared = ({ showMessage }) => {
  const  [sharedFiles, setSharedFiles ]= useState([])

  const [loadingSharedFiles, setLoadingSharedFiles] = useState(true)
  const context = useContext(AppContext)
  const reloadSharedFiles = context[8]
  const setReloadSharedFiles = context[9]

  const handleSort = async  (typeSort) => {
    const sortSharedFiles = await onSort(typeSort, [...sharedFiles])
    setSharedFiles(sortSharedFiles)
  }

  const listSharedFiles = () => {
    getSharedFiles()
    .then((res) => {
      setLoadingSharedFiles(false);
      setSharedFiles(res.data)
      setReloadSharedFiles(false)
      
    })
    .catch((err) => {
      console.log(err);
      setLoadingSharedFiles(false);
      showMessage(err.message, "error");
      setReloadSharedFiles(false)
    });
  }

  useEffect(()=> {
    listSharedFiles()
  }, [reloadSharedFiles])

    
  return (
    <>
      <FileComponent 
      loading={loadingSharedFiles}
      files={sharedFiles}
      onSort={handleSort}
      isSharedSection/>

    </>
  );
};

export default WithMessage(WithAppLayout(Shared));
