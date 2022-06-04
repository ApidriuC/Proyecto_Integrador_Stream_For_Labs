import React, { useContext, useEffect, useState } from 'react';
import '../styles/files.css'
import WithMessage from '../hocs/withMessage';
import WithAppLayout from '../layouts/appLayout'
import FileComponent from "../components/file";
import { getFiles } from '../services/fileApiService'
import { AppContext } from '../context/AppProvider';
import { onSort } from '../util/sort'
import { makeTree } from '../util/tree'


const Files = ({ showMessage }) => {


    const [currentDir, setCurrentDir] = useState([])
    const [loadingFiles, setLoadingFiles] = useState(true)
    const context = useContext(AppContext)
    const user = context[3];
    const reloadFiles = context[8]
    const setReloadFiles = context[9]
    

    const handleSort = async  (typeSort) => {
      const dir = [...currentDir[currentDir.length - 1].children]
      const nameDir = currentDir[currentDir.length - 1].dir
      console.log(dir);
      const sortFiles = await onSort(typeSort, [...dir.map(d => ({...d, name: d.dir}))])

      
      const current = [...currentDir]
      current.pop()
      current.push({
        dir: nameDir,
        children: sortFiles
      })
      setCurrentDir(current)
    }
    

    const listFiles = () => {
      getFiles()
      .then( (res) => {
        setLoadingFiles(false);
        const username =  user.username
        const dirs = makeTree(username, res.data)
        const current = [...currentDir]
        current.push(dirs)
        setCurrentDir(current)

        setReloadFiles(false)
      })
      .catch((err) => {
        console.log(err);
        setLoadingFiles(false);
        showMessage(err.message, "error");
        setReloadFiles(false)
      });
    }

    const onSelectDir = (dir) => {
      const current = [...currentDir]
      current.push(dir)
      setCurrentDir(current)
      console.log(dir);
    }

    const backDirectory = () => {
      console.log("currentDir: ", currentDir);

      const current = [...currentDir]
      current.pop()

      setCurrentDir(current)
    }


    useEffect(()=> {
      listFiles()
    }, [reloadFiles])
    
    return (
      <>
        <FileComponent  
        loading = {loadingFiles}
        dirs = {currentDir[currentDir.length-1]}
        onSort={handleSort}
        onSelectedFile={onSelectDir}
        backDirectory={backDirectory}/>
      </>
    );

}

export default WithMessage(WithAppLayout(Files))