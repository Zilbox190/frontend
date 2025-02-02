import React from 'react'

interface Props {
  title: string,
  children: React.ReactNode
}

const Notice = (props: Props) => {
  return (
    <div className="bg-gray-300 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 py-3 md:py-4 px-4 md:px-5 rounded-lg">
      <h3 className="text-base mb-1">{props.title}</h3>
      <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{props.children}</div>
    </div>
  )
}

export default Notice