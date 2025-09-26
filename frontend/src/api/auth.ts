import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_BASE_URL } from '../config/env' 
import { toast } from "sonner"

export const useUsers = () => {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/v1/auth`)
            return data
        } catch (error: any) {
            const message = error.response?.data?.message || 'Something went wrong while fetching users.'
            toast(message);
            throw new Error(message)
        }
    },
  })
}
