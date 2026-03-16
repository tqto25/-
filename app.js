const { createApp, ref, computed, watch } = Vue;

createApp({
    setup() {
        const currentPage = ref('list');
        const activeTab = ref('ticket');
        const lives = ref(JSON.parse(localStorage.getItem('lives') || '[]'));
        const currentIndex = ref(null);

        const newLive = ref({ name: '', venue: '', open: '', start: '', price: 0, drink: 600 });
        const newTicketNo = ref('');
        const newGuest = ref({ name: '', ticketNos: [], payType: 'both', extra: 0 });

        // 保存処理
        watch(lives, (newVal) => {
            localStorage.setItem('lives', JSON.stringify(newVal));
        }, { deep: true });

        const addLive = () => {
            lives.value.push({ ...newLive.value, tickets: [], guests: [] });
            newLive.value = { name: '', venue: '', open: '', start: '', price: 0, drink: 600 };
        };

        const viewDetail = (index) => {
            currentIndex.value = index;
            currentPage.value = 'detail';
        };

        const currentLive = computed(() => lives.value[currentIndex.value] || {});

        const addTicket = () => {
            if (!newTicketNo.value) return;
            currentLive.value.tickets.push({ no: newTicketNo.value, assigned: false });
            newTicketNo.value = '';
        };

        const unassignedTickets = computed(() => 
            currentLive.value.tickets.filter(t => !t.assigned || newGuest.value.ticketNos.includes(t.no))
        );

        const toggleTicketSelection = (no) => {
            const index = newGuest.value.ticketNos.indexOf(no);
            if (index > -1) newGuest.value.ticketNos.splice(index, 1);
            else newGuest.value.ticketNos.push(no);
        };

        const calculateGuestTotal = (guest) => {
            const count = guest.ticketNos.length;
            let total = guest.extra || 0;
            if (guest.payType === 'both' || guest.payType === 'ticket') total += count * currentLive.value.price;
            if (guest.payType === 'both' || guest.payType === 'drink') total += count * currentLive.value.drink;
            return total;
        };

        const addGuest = () => {
            currentLive.value.guests.push({ ...newGuest.value });
            newGuest.value.ticketNos.forEach(no => {
                const t = currentLive.value.tickets.find(t => t.no === no);
                if (t) t.assigned = true;
            });
            newGuest.value = { name: '', ticketNos: [], payType: 'both', extra: 0 };
        };

        const totalStats = computed(() => {
            const stats = { count: 0, ticket: 0, drink: 0, extra: 0, grand: 0 };
            currentLive.value.guests.forEach(g => {
                const count = g.ticketNos.length;
                stats.count += count;
                const tPrice = (g.payType === 'both' || g.payType === 'ticket') ? count * currentLive.value.price : 0;
                const dPrice = (g.payType === 'both' || g.payType === 'drink') ? count * currentLive.value.drink : 0;
                stats.ticket += tPrice;
                stats.drink += dPrice;
                stats.extra += g.extra;
            });
            stats.grand = stats.ticket + stats.drink + stats.extra;
            return stats;
        });

        return {
            currentPage, activeTab, lives, newLive, viewDetail, currentLive,
            newTicketNo, addTicket, unassignedTickets, newGuest, 
            toggleTicketSelection, addGuest, calculateGuestTotal, totalStats, addLive
        };
    }
}).mount('#app');