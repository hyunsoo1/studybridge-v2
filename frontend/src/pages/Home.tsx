import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { ArrowRight, Search, Users, CheckCircle, Zap } from "lucide-react";

export default function Home() {
  const steps = [
    { icon: Search, title: "1. 스터디 찾기", desc: "분야와 일정에 맞는 스터디를 검색하세요." },
    { icon: Users, title: "2. 신청 메시지 작성", desc: "목표와 열정을 담아 신청서를 제출하세요." },
    { icon: CheckCircle, title: "3. 수락 및 합류", desc: "스터디장의 수락을 받고 그룹에 합류하세요." },
    { icon: Zap, title: "4. 목표 달성", desc: "함께 공부하며 원하던 목표를 이뤄보세요." },
  ];

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background py-20 lg:py-32">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              새로운 학기를 위한 최고의 선택
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6"
            >
              목표를 향한 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">가장 빠른 길</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10"
            >
              StudyBridge는 대학생들을 위한 프리미엄 스터디 매칭 플랫폼입니다. 
              검증된 멤버들과 함께 더 높은 목표를 달성하세요.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/studies">
                <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 shadow-lg shadow-primary/20 group">
                  스터디 찾아보기
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/create">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 bg-background">
                  스터디 만들기
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">어떻게 이용하나요?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                복잡한 절차 없이 간편하게 스터디를 시작할 수 있습니다. 
                목표에만 집중할 수 있도록 StudyBridge가 돕겠습니다.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card border border-border p-6 rounded-2xl shadow-sm hover-elevate transition-all"
                >
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                    <step.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}