import axios from 'axios'
import { getLocalSesion } from '../util/auth'


const multipartHeader = {
    'Content-Type' : 'multipart/form-data'
}

const getAxiosInstance =  () => {
    return axios.create({
        baseURL: `${process.env.REACT_APP_GATEWAY_SERVICE_BASE_URL}/api`
    });   
}


export const upload = async (formData, onUploadProgress, cancelToken) => {
    const { token } = await  getLocalSesion();
    console.log(token);
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.post('/file', formData, 
    { cancelToken,
      headers: {...multipartHeader, 'Authorization': `Bearer ${token}`
    },
    onUploadProgress})
}


export const downloadFile = async (fileId) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get(`/file/${fileId}`, 
        { headers: {'Authorization': `Bearer ${token}` },
        responseType: 'blob'
    })
}

export const shareFile = async (fileId, userToShareId) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.post(`/file/share`, 
        {fileId, userToShareId},
        {headers: {'Authorization': `Bearer ${token}` }
    })
}

//LISTAR USUARIOS
export const getUsuarios = async () => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get('/users', 
    { headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }})
}
  
export const getFiles = async () => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get('/file', 
    { headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }})
}

export const getSharedFiles = async () => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get('/file/shared', 
    { headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }})
}

export const getStorageUsed = async () => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get('/file/storage', 
    { headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }})
}

export const getMaxStorageAvailable = async () => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get('/file/max-storage', 
    { headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }})
}

export const removeFiles = async (files) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.delete('/file',
    { data: {files},
      headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }
    })
}