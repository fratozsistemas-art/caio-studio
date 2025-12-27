import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdvancedFilters({
  searchQuery,
  setSearchQuery,
  selectedLayer,
  setSelectedLayer,
  selectedStatus,
  setSelectedStatus,
  selectedCategory,
  setSelectedCategory,
  selectedTags,
  setSelectedTags,
  allTags,
  allCategories,
  onClearFilters
}) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const hasActiveFilters = searchQuery || selectedLayer !== 'all' || 
    selectedStatus !== 'all' || selectedCategory !== 'all' || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar ventures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Layer Filter */}
        <Select value={selectedLayer} onValueChange={setSelectedLayer}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Todas Camadas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Camadas</SelectItem>
            <SelectItem value="startup">Startup</SelectItem>
            <SelectItem value="scaleup">Scale-up</SelectItem>
            <SelectItem value="deeptech">Deep Tech</SelectItem>
            <SelectItem value="platform">Platform</SelectItem>
            <SelectItem value="cultural">Cultural</SelectItem>
            <SelectItem value="winwin">Win-Win</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Todos Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="development">Desenvolvimento</SelectItem>
            <SelectItem value="research">Pesquisa</SelectItem>
            <SelectItem value="scaling">Scaling</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showAdvanced ? 'Menos' : 'Mais'} Filtros
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Todas Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          isSelected
                            ? 'bg-[#C7A763] text-[#06101F] font-medium'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}