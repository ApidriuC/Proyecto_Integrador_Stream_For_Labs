import axios from 'axios'
import { getLocalSesion } from '../util/auth'


const getAxiosInstance = () => {
    return axios.create({
        baseURL: `${process.env.REACT_APP_GATEWAY_SERVICE_BASE_URL}/api`
    });
}

export const listVideos = async () => {
    const { token } = await getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get(`/video`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } })}



export const downloadVideo = async (videoId) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.get(`/video/download/${videoId}`, 
        { headers: {'Authorization': `Bearer ${token}` },
        responseType: 'blob'
    })
}

export const shareVideo = async (videoId, userToShareId) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.post(`/video/share`, 
        {videoId, userToShareId},
        {headers: {'Authorization': `Bearer ${token}` }
    })
}


export const removeVideos = async (videos) => {
    const { token } = await  getLocalSesion();
    const axiosInstance = await getAxiosInstance()
    return axiosInstance.delete('/video',
    { data: {files: videos},
      headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' }
    })
}

