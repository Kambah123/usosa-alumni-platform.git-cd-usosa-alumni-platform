'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ForumsList() {
  const [forums, setForums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Mock data for forums (would be fetched from API)
  const mockForums = [
    {
      id: '1',
      name: 'USOSA General Discussion',
      description: 'General discussion forum for all USOSA members',
      isGeneral: true,
      topics: 156,
      posts: 1243,
      lastActivity: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: '2',
      name: 'FGC Buni-Yadi Alumni Forum',
      description: 'Discussion forum for Federal Government College, Buni-Yadi alumni',
      schoolId: {
        id: '1',
        name: 'Federal Government College, Buni-Yadi',
        shortName: 'FGC Buni-Yadi'
      },
      isGeneral: false,
      topics: 87,
      posts: 542,
      lastActivity: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: '3',
      name: 'FGGC Potiskum Alumni Forum',
      description: 'Discussion forum for Federal Government Girls College, Potiskum alumni',
      schoolId: {
        id: '2',
        name: 'Federal Government Girls College, Potiskum',
        shortName: 'FGGC Potiskum'
      },
      isGeneral: false,
      topics: 64,
      posts: 389,
      lastActivity: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
      id: '4',
      name: 'FGC Jos Alumni Forum',
      description: 'Discussion forum for Federal Government College, Jos alumni',
      schoolId: {
        id: '3',
        name: 'Federal Government College, Jos',
        shortName: 'FGC Jos'
      },
      isGeneral: false,
      topics: 112,
      posts: 876,
      lastActivity: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    },
    {
      id: '5',
      name: 'Kings College Lagos Alumni Forum',
      description: 'Discussion forum for Kings College, Lagos alumni',
      schoolId: {
        id: '6',
        name: 'King\'s College, Lagos',
        shortName: 'KC Lagos'
      },
      isGeneral: false,
      topics: 203,
      posts: 1567,
      lastActivity: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    }
  ]
  
  useEffect(() => {
    // Simulate API call to fetch forums
    const fetchForums = async () => {
      try {
        setLoading(true)
        
        // This would be replaced with actual API call
        // const response = await fetch('/api/forums')
        // const data = await response.json()
        // setForums(data.forums)
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000))
        setForums(mockForums)
      } catch (err) {
        console.error('Error fetching forums:', err)
        setError('Failed to load forums. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchForums()
  }, [])
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    
    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-6xl text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading forums...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-6xl text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3 inline-block">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">USOSA Forums</h1>
          <p className="mt-2 text-gray-600">Connect and engage with fellow alumni through our discussion forums</p>
        </div>
        
        <div className="mb-8">
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome to USOSA Forums</h2>
                <p className="mt-2 max-w-2xl">
                  Join discussions with fellow alumni, share experiences, and stay connected with your school community.
                </p>
              </div>
              <Link 
                href="/forums/guidelines" 
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Forum Guidelines
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">All Forums</h2>
            <Link 
              href="/schools" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View Schools Directory
            </Link>
          </div>
          
          <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
            <ul className="divide-y divide-gray-200">
              {forums.map(forum => (
                <li key={forum.id} className="hover:bg-gray-50">
                  <Link href={`/forums/${forum.id}`} className="block">
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-full ${
                            forum.isGeneral ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {forum.isGeneral ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{forum.name}</h3>
                            <p className="text-sm text-gray-500">{forum.description}</p>
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <div className="flex items-center space-x-8">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{forum.topics}</p>
                              <p className="text-xs text-gray-500">Topics</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{forum.posts}</p>
                              <p className="text-xs text-gray-500">Posts</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-900">{formatDate(forum.lastActivity)}</p>
                              <p className="text-xs text-gray-500">Last Activity</p>
                            </div>
                          </div>
                        </div>
                        <div className="md:hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
