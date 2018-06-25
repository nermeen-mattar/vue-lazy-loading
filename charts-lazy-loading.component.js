// charts component
Vue.component('chart-item', {
    props: ['cdata'],
    template: ' <line-chart :data="cdata.values" v-if="cdata.type ==\'line\'"></line-chart><area-chart :data="cdata.values" v-else-if="cdata.type ==\'area\'"></area-chart><pie-chart :data="cdata.values" v-else-if="cdata.type ==\'pie\'"></pie-chart> <column-chart v-else :data="cdata.values"></column-chart>'
})

var prioritizedCharts = new Vue({
    el: '#prioritized-charts',
    data: {
        chartsData: [],
        chartsPriorityData: []
    },
    methods: {
        initChartsPrioritiesData: function() {
            this.$http.get('https://www.mocky.io/v2/5a218e4a2d00001c2be0037c')
                .then(response => {
                    prioritizedCharts.chartsPriorityData = response.body;
                    prioritizedCharts.chartsPriorityData.forEach((cdata) => {
                        prioritizedCharts.chartsData.push({}); // to view loaders until chart is ready
                    });
                    prioritizedCharts.getChartsByPriority();
                }, response => {
                    console.log('Error getting charts priorities data');
                });
        },
        getChartsByPriority: function() {
            const copyChartsPriorities = prioritizedCharts.chartsPriorityData.slice();
            /* deep copy array but not inner objects (note: we will only modify the array)*/
            copyChartsPriorities.sort((charta, chartb) => charta.priority > chartb.priority);
            let chartIndex = 0;
            const recursiveGet = (url) => {
                /* look for same priorities */
                while ((chartIndex < copyChartsPriorities.length - 1) &&
                    copyChartsPriorities[chartIndex].priority === copyChartsPriorities[chartIndex + 1].priority) {
                    chartIndex++;
                    recursiveGet(chartsDataServices[copyChartsPriorities[chartIndex].order]);
                }
                this.$http.get(url)
                    .then(response => {
                        Vue.set(prioritizedCharts.chartsData,
                            response.body.order, response.body);
                        let waitForSamePriority = false;
                        copyChartsPriorities.forEach((chart, index) => {
                            if (chart.order === response.body.order) {
                                waitForSamePriority = index > 0 && copyChartsPriorities[index - 1].priority === chart.priority || index < copyChartsPriorities.length && copyChartsPriorities[index + 1] === chart.priority;
                                copyChartsPriorities.splice(index, 1); // remove data for the received chart 
                                chartIndex--;
                            }
                        });
                        if (!waitForSamePriority && copyChartsPriorities.length) {
                            chartIndex++;
                            recursiveGet(chartsDataServices[copyChartsPriorities[0].order]);
                        }
                    }, response => {
                        console.log('Error getting chart data');
                    });
            }
            /* zero to start with the heighest priority (this is the entry point to recursion) */
            recursiveGet(chartsDataServices[copyChartsPriorities[0].order]);

        }
    }
})

prioritizedCharts.initChartsPrioritiesData();

// dummy services
let chartsDataServices = [ // ordered by chart order
    'https://www.mocky.io/v2/5a219e4e2d0000752ae0039e?mocky-delay=4000ms', //order: 0, priority: 2
    'https://www.mocky.io/v2/5a21862b2d0000ef2ae0035d?mocky-delay=500ms', //order: 1 priority: 1 (most priority)
    'https://www.mocky.io/v2/5a21865e2d0000eb2ae00360?mocky-delay=2500ms', //order: 2, priority: 3 (least priority)
    'https://www.mocky.io/v2/5a2186b82d0000f62ae00362?mocky-delay=200ms', //order: 3, priority: 3 (least priority)
    /* note that eventhough chart 3 takes 200ms it is displayed before the last chart (chart 2) */
    'https://www.mocky.io/v2/5a2186e92d0000f82ae00364?mocky-delay=4000ms', //order: 4, priority: 2
    'https://www.mocky.io/v2/5a2185962d0000eb2ae00359?mocky-delay=4000ms' //order: 5, priority: 2
]
