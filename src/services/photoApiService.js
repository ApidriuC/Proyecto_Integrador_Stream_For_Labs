import axios from 'axios'
import { getLocalSesion } from '../util/auth'

const getAxiosInstance =  () => {
    return axios.create({
        baseURL: `${process.env.REACT_APP_GATEWAY_SERVICE_BASE_URL}/api`
    });   
}

export const listPhotos = async ()=> {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get(`/photo`,
    { headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }})}

export const downloadPhoto = async (photoId) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get(`/photo/download/${photoId}`, 
        { headers: {'Authorization': `Bearer ${token}` },
        responseType: 'blob'
    })
}

export const sharePhoto = async (photoId, userToShareId) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.post(`/photo/share`, 
        {photoId, userToShareId},
        {headers: {'Authorization': `Bearer ${token}` }
    })
}

export const removePhotos = async (photos) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.delete('/photo',
    { data: {files: photos},
      headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }
    })
}