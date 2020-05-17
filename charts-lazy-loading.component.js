// items component
Vue.component('prioritized-item', {
    props: ['cdata'],
    template: ' <line-chart :data="cdata.values" v-if="cdata.type ==\'line\'"></line-chart><area-chart :data="cdata.values" v-else-if="cdata.type ==\'area\'"></area-chart><img v-else-if="cdata.type== \'ad\'" :src="cdata.img"/><pie-chart :data="cdata.values" v-else-if="cdata.type ==\'pie\'"></pie-chart> <column-chart v-else :data="cdata.values"></column-chart>'
})

let prioritizer = new Vue({
    el: '#prioritized-items-container',
    data: {
        data: [],
        priorityData: []
    },
    methods: {
        initItemsPrioritiesData: function() {
            this.$http.get('https://www.mocky.io/v2/5a218e4a2d00001c2be0037c')
                .then(response => {
                    prioritizer.priorityData = response.body;
                    prioritizer.priorityData.forEach((cdata) => {
                        prioritizer.data.push({}); // to view loaders until item is ready
                    });
                    prioritizer.getItemsByPriority();
                }, response => {
                    console.log('Error getting priorities data');
                });
        },
        getItemsByPriority: function() {
            const copyPriorities = prioritizer.priorityData.slice();
            /* deep copy array but not inner objects (note: we will only modify the array)*/
            copyPriorities.sort((itema, itemb) => itema.priority > itemb.priority);
            let itemIndex = 0;
            const recursiveGet = (url) => {
                /* look for same priorities */
                while ((itemIndex < copyPriorities.length - 1) &&
                    copyPriorities[itemIndex].priority === copyPriorities[itemIndex + 1].priority) {
                    itemIndex++;
                    recursiveGet(dataServices[copyPriorities[itemIndex].order]);
                }
                this.$http.get(url)
                    .then(response => {
                        Vue.set(prioritizer.data,
                            response.body.order, response.body);
                        let waitForSamePriority = false;
                        copyPriorities.forEach((item, index) => {
                            if (item.order === response.body.order) {
                                waitForSamePriority = index > 0 && copyPriorities[index - 1].priority === item.priority || index < copyPriorities.length && copyPriorities[index + 1] === item.priority;
                                copyPriorities.splice(index, 1); // remove data for the received item 
                                itemIndex--;
                            }
                        });
                        if (!waitForSamePriority && copyPriorities.length) {
                            itemIndex++;
                            recursiveGet(dataServices[copyPriorities[0].order]);
                        }
                    }, response => {
                        console.log('Error getting item data');
                    });
            }
            /* zero to start with the heighest priority (this is the entry point to recursion) */
            recursiveGet(dataServices[copyPriorities[0].order]);

        }
    }
})

prioritizer.initItemsPrioritiesData();

// dummy services
let dataServices = [ // ordered by item order
    'https://www.mocky.io/v2/5e2da40c3000008600e77d39?mocky-delay=4000ms', //order: 0, priority: 2
    'https://www.mocky.io/v2/5e2da4ca300000ad34e77d3b?mocky-delay=500ms', //order: 1 priority: 1 (most priority)
    'https://www.mocky.io/v2/5a21865e2d0000eb2ae00360?mocky-delay=2500ms', //order: 2, priority: 3 (least priority)
    'https://www.mocky.io/v2/5a2186b82d0000f62ae00362?mocky-delay=200ms', //order: 3, priority: 3 (least priority)
    /* note that eventhough item 3 takes 200ms it is displayed before the last item (item 2) */
    'https://www.mocky.io/v2/5a2186e92d0000f82ae00364?mocky-delay=4000ms', //order: 4, priority: 2
    'https://www.mocky.io/v2/5a2185962d0000eb2ae00359?mocky-delay=4000ms' //order: 5, priority: 2
]