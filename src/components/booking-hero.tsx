"use client"
import { Hero } from '@/components/ui/hero'
import { Server, Monitor, Cpu, HardDrive } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BookingHero() {
  return (
    <div className="relative">
      <Hero
        title="DOIT Hypervisor"
        subtitle="Comprehensive Management for Your DOIT virtualization Environment"
        actions={[
          {
            label: "Open Dashboard",
            href: "/dashboard",
            variant: "default"
          },
          {
            label: "Learn More",
            href: "#features",
            variant: "outline"
          }
        ]}
        titleClassName="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold"
        subtitleClassName="text-lg md:text-xl xl:text-2xl max-w-[600px] xl:max-w-[800px] text-muted-foreground"
        actionsClassName="mt-8"
      />
      
      {/* Feature highlights */}
      <div id="features" className="container max-w-7xl mx-auto -mt-20 relative z-10 px-5 md:px-10 xl:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <motion.div 
            className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-6 text-center cursor-pointer transition-all duration-300 hover:bg-background/90 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 group"
            whileHover={{ scale: 1.05, rotateY: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Server className="w-8 h-8 mx-auto mb-3 text-primary group-hover:text-primary/80 transition-colors" />
            </motion.div>
            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">Server Monitoring</h3>
            <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Real-time server performance and resource monitoring</p>
          </motion.div>
          
          <motion.div 
            className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-6 text-center cursor-pointer transition-all duration-300 hover:bg-background/90 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 group"
            whileHover={{ scale: 1.05, rotateY: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Monitor className="w-8 h-8 mx-auto mb-3 text-primary group-hover:text-primary/80 transition-colors" />
            </motion.div>
            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">VM Management</h3>
            <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Start, stop, and monitor virtual machines</p>
          </motion.div>
          
          <motion.div 
            className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-6 text-center cursor-pointer transition-all duration-300 hover:bg-background/90 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 group"
            whileHover={{ scale: 1.05, rotateY: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Cpu className="w-8 h-8 mx-auto mb-3 text-primary group-hover:text-primary/80 transition-colors" />
            </motion.div>
            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">Resource Analytics</h3>
            <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">CPU, memory, and storage usage analytics</p>
          </motion.div>
          
          <motion.div 
            className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-6 text-center cursor-pointer transition-all duration-300 hover:bg-background/90 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 group"
            whileHover={{ scale: 1.05, rotateY: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <HardDrive className="w-8 h-8 mx-auto mb-3 text-primary group-hover:text-primary/80 transition-colors" />
            </motion.div>
            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">Cluster Overview</h3>
            <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Multi-node cluster status and management</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}