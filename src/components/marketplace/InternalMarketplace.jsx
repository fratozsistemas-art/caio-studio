import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Package, DollarSign, Users, Wrench, Lightbulb, CheckCircle, XCircle, Clock, Send, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlowCard from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function InternalMarketplace({ ventures, talents }) {
  const [showListingForm, setShowListingForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [user, setUser] = useState(null);

  const [listingForm, setListingForm] = useState({
    venture_id: '',
    resource_type: 'talent',
    title: '',
    description: '',
    talent_id: '',
    availability: 'available',
    capacity: '',
    unit: '',
    cost: '',
    duration_weeks: '',
    skills: [],
    tags: []
  });

  const [requestForm, setRequestForm] = useState({
    requested_capacity: '',
    duration_weeks: '',
    justification: '',
    use_case: '',
    start_date: ''
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    getUser();
  }, []);

  const { data: listings } = useQuery({
    queryKey: ['resourceListings', filterType],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ResourceListing',
        operation: 'list'
      });
      const data = res.data?.data || [];
      if (filterType === 'all') return data;
      return data.filter(l => l.resource_type === filterType);
    }
  });

  const { data: requests } = useQuery({
    queryKey: ['resourceRequests'],
    queryFn: async () => {
      const res = await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ResourceRequest',
        operation: 'list'
      });
      return res.data?.data || [];
    }
  });

  const createListingMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ResourceListing',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resourceListings']);
      toast.success('Recurso listado!');
      setShowListingForm(false);
      resetListingForm();
    }
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ResourceRequest',
        operation: 'create',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resourceRequests']);
      toast.success('Solicitação enviada!');
      setShowRequestForm(false);
      setSelectedListing(null);
      resetRequestForm();
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.functions.invoke('secureEntityQuery', {
        entity_name: 'ResourceRequest',
        operation: 'update',
        id,
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resourceRequests']);
      toast.success('Status atualizado!');
    }
  });

  const resetListingForm = () => {
    setListingForm({
      venture_id: '',
      resource_type: 'talent',
      title: '',
      description: '',
      talent_id: '',
      availability: 'available',
      capacity: '',
      unit: '',
      cost: '',
      duration_weeks: '',
      skills: [],
      tags: []
    });
  };

  const resetRequestForm = () => {
    setRequestForm({
      requested_capacity: '',
      duration_weeks: '',
      justification: '',
      use_case: '',
      start_date: ''
    });
  };

  const handleRequestResource = () => {
    if (!selectedListing || !user) return;

    createRequestMutation.mutate({
      listing_id: selectedListing.id,
      requesting_venture_id: ventures[0]?.id || '',
      requester_email: user.email,
      requester_name: user.full_name || user.email,
      ...requestForm
    });
  };

  const handleApproveRequest = (request, approved) => {
    updateRequestMutation.mutate({
      id: request.id,
      data: {
        ...request,
        status: approved ? 'approved' : 'rejected',
        approved_by: user?.email,
        approved_at: new Date().toISOString(),
        approval_notes: approved ? 'Aprovado' : 'Rejeitado'
      }
    });
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'talent': return <Users className="w-5 h-5" />;
      case 'tool': return <Wrench className="w-5 h-5" />;
      case 'budget': return <DollarSign className="w-5 h-5" />;
      case 'expertise': return <Lightbulb className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-white/10 text-white';
    }
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'available': return 'bg-green-500/20 text-green-400';
      case 'partially_available': return 'bg-yellow-500/20 text-yellow-400';
      case 'reserved': return 'bg-orange-500/20 text-orange-400';
      case 'unavailable': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/10 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard glowColor="gold" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-[#C7A763]" />
            <h3 className="text-xl font-bold text-white">Marketplace Interno</h3>
          </div>
          <Button
            onClick={() => setShowListingForm(!showListingForm)}
            className="bg-gradient-to-r from-[#C7A763] to-[#A88B4A] text-[#06101F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Listar Recurso
          </Button>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="marketplace">Recursos Disponíveis</TabsTrigger>
            <TabsTrigger value="requests">Minhas Solicitações</TabsTrigger>
            <TabsTrigger value="manage">Gerenciar Requisições</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
            {/* Listing Form */}
            <AnimatePresence>
              {showListingForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-6 rounded-xl bg-white/5 border border-white/10 space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/70 mb-2 block">Venture *</label>
                      <Select value={listingForm.venture_id} onValueChange={(v) => setListingForm({...listingForm, venture_id: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Selecione a venture" />
                        </SelectTrigger>
                        <SelectContent>
                          {ventures?.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-white/70 mb-2 block">Tipo de Recurso *</label>
                      <Select value={listingForm.resource_type} onValueChange={(v) => setListingForm({...listingForm, resource_type: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="talent">Talento</SelectItem>
                          <SelectItem value="tool">Ferramenta</SelectItem>
                          <SelectItem value="budget">Budget</SelectItem>
                          <SelectItem value="infrastructure">Infraestrutura</SelectItem>
                          <SelectItem value="expertise">Expertise</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {listingForm.resource_type === 'talent' && (
                    <div>
                      <label className="text-sm text-white/70 mb-2 block">Talento</label>
                      <Select value={listingForm.talent_id} onValueChange={(v) => setListingForm({...listingForm, talent_id: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Selecione o talento" />
                        </SelectTrigger>
                        <SelectContent>
                          {talents?.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.talent_name} - {t.role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Título *</label>
                    <Input
                      value={listingForm.title}
                      onChange={(e) => setListingForm({...listingForm, title: e.target.value})}
                      placeholder="Ex: Designer UI/UX Senior - 20h/semana"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Descrição *</label>
                    <Textarea
                      value={listingForm.description}
                      onChange={(e) => setListingForm({...listingForm, description: e.target.value})}
                      placeholder="Descreva o recurso disponível..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-white/70 mb-2 block">Capacidade</label>
                      <Input
                        type="number"
                        value={listingForm.capacity}
                        onChange={(e) => setListingForm({...listingForm, capacity: e.target.value})}
                        placeholder="20"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70 mb-2 block">Unidade</label>
                      <Input
                        value={listingForm.unit}
                        onChange={(e) => setListingForm({...listingForm, unit: e.target.value})}
                        placeholder="horas/semana, R$, licenças"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70 mb-2 block">Duração (semanas)</label>
                      <Input
                        type="number"
                        value={listingForm.duration_weeks}
                        onChange={(e) => setListingForm({...listingForm, duration_weeks: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => createListingMutation.mutate(listingForm)}
                      disabled={!listingForm.venture_id || !listingForm.title || !listingForm.description}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Listar Recurso
                    </Button>
                    <Button onClick={() => setShowListingForm(false)} variant="ghost">
                      Cancelar
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="talent">Talentos</SelectItem>
                  <SelectItem value="tool">Ferramentas</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="expertise">Expertise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listings Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings?.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlowCard glowColor="mixed" className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-[#C7A763]/20 text-[#C7A763]">
                        {getResourceIcon(listing.resource_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{listing.title}</h4>
                        <Badge className={getAvailabilityColor(listing.availability)}>
                          {listing.availability}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{listing.description}</p>

                    {listing.capacity && (
                      <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                        <Package className="w-4 h-4" />
                        {listing.capacity} {listing.unit}
                      </div>
                    )}

                    {listing.duration_weeks && (
                      <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
                        <Clock className="w-4 h-4" />
                        {listing.duration_weeks} semanas
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowRequestForm(true);
                      }}
                      size="sm"
                      className="w-full bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF]"
                      disabled={listing.availability === 'unavailable'}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Solicitar
                    </Button>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="space-y-4">
              {requests?.filter(r => r.requester_email === user?.email).map(req => {
                const listing = listings?.find(l => l.id === req.listing_id);
                return (
                  <GlowCard key={req.id} glowColor="cyan" className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{listing?.title}</h4>
                        <p className="text-sm text-slate-400 mb-2">{req.justification}</p>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                          {req.requested_capacity && (
                            <Badge variant="outline" className="border-white/20">
                              {req.requested_capacity} {listing?.unit}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="manage">
            <div className="space-y-4">
              {requests?.filter(r => r.status === 'pending').map(req => {
                const listing = listings?.find(l => l.id === req.listing_id);
                return (
                  <GlowCard key={req.id} glowColor="gold" className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{listing?.title}</h4>
                        <p className="text-sm text-slate-400 mb-1">Por: {req.requester_name}</p>
                        <p className="text-sm text-slate-300 mb-2">{req.justification}</p>
                        {req.use_case && (
                          <p className="text-xs text-slate-500 mb-2">Caso de uso: {req.use_case}</p>
                        )}
                        <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveRequest(req, true)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleApproveRequest(req, false)}
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </GlowCard>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </GlowCard>

      {/* Request Form Modal */}
      <AnimatePresence>
        {showRequestForm && selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRequestForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a1628] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-white mb-4">Solicitar: {selectedListing.title}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Quantidade/Capacidade</label>
                  <Input
                    type="number"
                    value={requestForm.requested_capacity}
                    onChange={(e) => setRequestForm({...requestForm, requested_capacity: e.target.value})}
                    placeholder={`Ex: ${selectedListing.capacity}`}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-2 block">Duração (semanas)</label>
                  <Input
                    type="number"
                    value={requestForm.duration_weeks}
                    onChange={(e) => setRequestForm({...requestForm, duration_weeks: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-2 block">Data de Início</label>
                  <Input
                    type="date"
                    value={requestForm.start_date}
                    onChange={(e) => setRequestForm({...requestForm, start_date: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-2 block">Justificativa *</label>
                  <Textarea
                    value={requestForm.justification}
                    onChange={(e) => setRequestForm({...requestForm, justification: e.target.value})}
                    placeholder="Por que você precisa deste recurso?"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-2 block">Caso de Uso</label>
                  <Textarea
                    value={requestForm.use_case}
                    onChange={(e) => setRequestForm({...requestForm, use_case: e.target.value})}
                    placeholder="Como pretende usar este recurso?"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleRequestResource}
                    disabled={!requestForm.justification}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Enviar Solicitação
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRequestForm(false);
                      resetRequestForm();
                    }}
                    variant="ghost"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}