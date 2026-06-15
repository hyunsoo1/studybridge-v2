import { useState } from "react";
import { Link } from "wouter";
import { STUDY_CATEGORIES, useStore, statusFor } from "@/lib/store";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, MapPin, Calendar, Users, Clock, UserRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Studies() {
  const { state } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [modeFilter, setModeFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");

  const categories = ["전체", ...STUDY_CATEGORIES];
  const modes = ["전체", ...Array.from(new Set(state.studies.map(study => study.mode)))];
  const statuses = ["전체", "모집 중", "모집 마감"];

  const filteredStudies = state.studies.filter((study) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const searchableText = [
      study.title,
      study.field,
      study.description,
      study.purpose,
      study.recruiterName,
      study.schedule,
      study.location,
      ...study.goals,
      ...study.tags
    ].join(" ").toLowerCase();

    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
    const status = statusFor(study);
    const matchesCategory = categoryFilter === "전체" || study.field === categoryFilter;
    const matchesMode = modeFilter === "전체" || study.mode === modeFilter;
    const matchesStatus = statusFilter === "전체" || status === statusFilter;

    return matchesSearch && matchesCategory && matchesMode && matchesStatus;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("전체");
    setModeFilter("전체");
    setStatusFilter("전체");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">스터디 찾기</h1>
              <p className="text-muted-foreground">분야, 진행 방식, 모집 상태를 비교하며 나에게 맞는 스터디를 찾아보세요.</p>
            </div>

            <Link href="/create">
              <Button className="w-full md:w-auto">스터디 등록</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제목, 분야, 설명, 모집자, 태그 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="분야 필터"
            >
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="진행 방식 필터"
            >
              {modes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="모집 상태 필터"
            >
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>

        {filteredStudies.length === 0 ? (
          <div className="py-20 text-center border border-dashed rounded-2xl bg-muted/20">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">검색 결과가 없습니다</h3>
            <p className="text-muted-foreground mb-6">검색어나 필터 조건을 다시 확인해보세요.</p>
            <Button variant="outline" onClick={resetFilters}>
              필터 초기화
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredStudies.map((study, index) => {
                const status = statusFor(study);
                const isClosed = status === "모집 마감";
                const isFull = study.current >= study.capacity;
                const fillPercent = Math.min((study.current / study.capacity) * 100, 100);
                const applicationsCount = state.applications.filter(app => app.studyId === study.id).length;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    key={study.id}
                    className="group relative flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all"
                  >
                    <div className={`h-2 w-full ${isClosed ? "bg-muted" : "bg-gradient-to-r from-primary to-blue-400"}`} />

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
                            {study.field}
                          </Badge>
                          <Badge variant="outline">{study.mode}</Badge>
                        </div>
                        <Badge
                          variant={isClosed ? "secondary" : "default"}
                          className={isClosed ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 shadow-none"}
                        >
                          {status}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {study.title}
                      </h3>

                      <p className="text-muted-foreground text-sm line-clamp-2 mb-5 flex-1">
                        {study.description}
                      </p>

                      <div className="space-y-3 mb-5 bg-muted/30 p-4 rounded-xl text-sm">
                        <div className="flex items-center text-foreground">
                          <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                          <span className="truncate">{study.schedule}</span>
                        </div>
                        <div className="flex items-center text-foreground">
                          <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                          <span className="truncate">{study.location}</span>
                        </div>
                        <div className="flex items-center text-foreground">
                          <Clock className="w-4 h-4 mr-3 text-muted-foreground" />
                          <span className="truncate">마감 {study.deadline} · {study.level}</span>
                        </div>
                        <div className="flex items-center text-foreground">
                          <UserRound className="w-4 h-4 mr-3 text-muted-foreground" />
                          <span className="truncate">{study.recruiterName} · 신청 {applicationsCount}명</span>
                        </div>
                        <div className="flex items-center text-foreground">
                          <Users className="w-4 h-4 mr-3 text-muted-foreground" />
                          <div className="flex-1 flex items-center justify-between">
                            <span>{study.current} / {study.capacity}명</span>
                            <span className="text-xs text-muted-foreground font-medium">{Math.round(fillPercent)}%</span>
                          </div>
                        </div>
                        <Progress value={fillPercent} className="h-1.5" />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {study.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-auto">
                        <Link href={`/studies/${study.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">상세 보기</Button>
                        </Link>
                        <Link href={`/studies/${study.id}`} className="flex-1">
                          <Button className="w-full" disabled={isClosed}>
                            {isClosed ? (isFull ? "인원 마감" : "마감됨") : "신청하기"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
}
