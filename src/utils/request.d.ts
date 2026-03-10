// src/utils/request.d.ts
declare module '@/utils/request' {
  import { AxiosRequestConfig } from 'axios'

  // 声明 request 函数的类型
  interface RequestFunction {
    <T = unknown>(config: AxiosRequestConfig): Promise<T>
  }

  const request: RequestFunction
  export default request
}
