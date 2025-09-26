export function devLog(...args: any[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args)
  }
}
