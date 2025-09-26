"use client"

import React, { useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Cloud, HardDrive, Lock, Share2, Edit, Search } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useNavigate } from "react-router-dom"

export default function HomePage() {
  const { login, isAuthenticated } = useAuth()
  const router = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/blob")
    }
  }, [isAuthenticated, router])
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg dark:bg-gray-950/80 dark:border-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <HardDrive className="h-7 w-7 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Uni<span className="text-blue-600">Drive</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </nav>
          <Button onClick={login} className="bg-blue-600 hover:bg-blue-700 text-white">
            Login
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900/20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Your Files,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Unified
              </span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300">
              UniDrive gives you a seamless, secure, and powerful file management experience with Azure Blob Storage.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                <Link href="/blob">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Powerful Features, Simplified</h2>
              <p className="mt-3 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
                Everything you need to manage your cloud storage efficiently.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Cloud className="w-8 h-8 text-blue-500" />}
                title="Unified Access"
                description="Manage files in Azure Blob Storage through a single, intuitive interface."
              />
              <FeatureCard
                icon={<Edit className="w-8 h-8 text-green-500" />}
                title="Office 365 Integration"
                description="Create, view, and edit Word, Excel, and PowerPoint documents directly in your browser."
              />
              <FeatureCard
                icon={<Lock className="w-8 h-8 text-red-500" />}
                title="Enterprise-Grade Security"
                description="Leverages Azure Active Directory for secure authentication and access control."
              />
              <FeatureCard
                icon={<Share2 className="w-8 h-8 text-purple-500" />}
                title="Advanced Sharing"
                description="Securely share files and folders with colleagues and external partners with granular permissions."
              />
              <FeatureCard
                icon={<Search className="w-8 h-8 text-yellow-500" />}
                title="Powerful Search"
                description="Quickly find any file across both storage providers with a unified, powerful search."
              />
              <FeatureCard
                icon={<HardDrive className="w-8 h-8 text-indigo-500" />}
                title="Scalable Storage"
                description="Benefit from the virtually limitless and cost-effective storage of Azure Blobs for large files and archives."
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Unify Your Drives?</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Contact our sales team to get a personalized demo or discuss your enterprise needs. We're here to help
                you streamline your cloud storage.
              </p>
              <div className="mt-8">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-blue-600" />
            <span className="font-semibold">UniDrive</span>
          </div>
          <p className="text-sm text-gray-500 mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} UniDrive Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-transparent hover:border-blue-200 dark:hover:border-blue-900">
      <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

