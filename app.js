const { createApp, ref, computed, watch } = Vue;

createApp({
    setup() {
        const currentPage = ref('list');
        const activeTab = ref('ticket');
        const lives = ref(JSON.parse(localStorage.getItem('lives') || '[]'));
        const currentIndex = ref(null);
        const editingIndex = ref(null); // 編集用

        const newLive = ref({ name: '', date: '', venue: '', open: '', start: '', price: null, drink: 600 });
        const newTicketNo = ref('');
        const newGuest = ref({ name: '', ticketNos: [], payType: 'both', extra: 0 });

        // 日付順に並び替えて表示
        const sortedLives = computed(() => {
            return [...lives.value].sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        watch(lives, (newVal) => {
            localStorage.setItem('lives', JSON.stringify(newVal));
        }, { deep: true });

        const addLive = () => {
            if(!newLive.value.name || !newLive.value.date) {
                alert("ライブ名と公演日は必須です！");
                return;
            }
            lives.value.push({ ...newLive.value, tickets: [], guests: [] });
            newLive.value = { name: '', date: '', venue: '', open: '', start: '', price: null, drink: 600 };
        };

        const viewDetail = (index) => {
            currentIndex.value = lives.value.indexOf(sortedLives.value[index]);
            currentPage.value = 'detail';
        };

        const currentLive = computed(() => lives.value[currentIndex.value] || {tickets:[], guests:[]});

        // 招待者の編集用：現在選択中のチケット＋未割当のチケットを表示
        const availableTicketsForEditing = computed(() => {
            const allTickets = currentLive.value.tickets || [];
            return allTickets.filter(t => {
                if (!t.assigned) return true;
                if (newGuest.value.ticketNos.includes(t.no)) return true;
                return false;
            });
        });

        const toggleTicketSelection = (no) => {
            const index = newGuest.value.ticketNos.indexOf(no);
            if (index > -1) newGuest.value.ticketNos.splice(index, 1);
            else newGuest.value.ticketNos.push(no);
        };

        const saveGuest = () => {
            if (!newGuest.value.name) return alert("名前を入力してください");

            // 以前のチケットの割当をリセット（編集時のみ）
            if (editingIndex.value !== null) {
                const oldGuest = currentLive.value.guests[editingIndex.value];
                oldGuest.ticketNos.forEach(no => {
                    const t = currentLive.value.tickets.find(tk => tk.no === no);
                    if (t) t.assigned = false;
                });
                currentLive.value.guests[editingIndex.value] = { ...newGuest.value };
            } else {
                currentLive.value.guests.push({ ...newGuest.value });
            }

            // 新しいチケットを「割当済」にする
            newGuest.value.ticketNos.forEach(no => {
                const t = currentLive.value.tickets.find(tk => tk.no === no);
                if (t) t.assigned = true;
            });

            cancelEdit();
        };

        const editGuest = (index) => {
            editingIndex.value = index;
            newGuest.value = JSON.parse(JSON.stringify(currentLive.value.guests[index]));
        };

        const cancelEdit = () => {
            editingIndex.value = null;
            newGuest.value = { name: '', ticketNos: [], payType: 'both', extra: 0 };
        };

        const addTicket = () => {
            if (!newTicketNo.value) return;
            currentLive.value.tickets.push({ no: newTicketNo.value, assigned: false });
            newTicketNo.value = '';
        };

        const calculateGuestTotal = (guest) => {
            const count = guest.ticketNos.length;
            let total = guest.extra || 0;
            const livePrice = currentLive.value.price || 0;
            const drinkPrice = currentLive.value.drink || 0;
            if (guest.payType === 'both' || guest.payType === 'ticket') total += count * livePrice;
            if (guest.payType === 'both' || guest.payType === 'drink') total += count * drinkPrice;
            return total;
        };

        const totalStats = computed(() => {
            const stats = { count: 0, ticket: 0, drink: 0, extra: 0, grand: 0 };
            (currentLive.value.guests || []).forEach(g => {
                const count = g.ticketNos.length;
                stats.count += count;
                const tPrice = (g.payType === 'both' || g.payType === 'ticket') ? count * (currentLive.value.price || 0) : 0;
                const dPrice = (g.payType === 'both' || g.payType === 'drink') ? count * (currentLive.value.drink || 0) : 0;
                stats.ticket += tPrice;
                stats.drink += dPrice;
                stats.extra += g.extra || 0;
            });
            stats.grand = stats.ticket + stats.drink + stats.extra;
            return stats;
        });

        return {
            currentPage, activeTab, lives, sortedLives, newLive, viewDetail, currentLive,
            newTicketNo, addTicket, newGuest, toggleTicketSelection, saveGuest, 
            editGuest, cancelEdit, editingIndex, availableTicketsForEditing,
            calculateGuestTotal, totalStats, addLive
        };
    }
}).mount('#app');