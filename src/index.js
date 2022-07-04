import _, { findIndex } from 'lodash';
import * as d3 from 'd3';
// import data from "./data.json";
import data from './data.json';

const colors = ['#2AC9B5FF', '#17362DFF', '#EA6578FF', '#F3C01EFF'];
const years = [...(new Set(data.map(({ year }) => year)))];
const cities = [...(new Set(data.map(({ city }) => city)))];
const citiesBySales = data.reduce((acc, item) => ({
  ...acc,
  [item.city]: [...(acc[item.city] || []), item.sales]
}), {});

const preparedData = Object.entries(citiesBySales).map(([city, sales], i) => ({ city, sales }));
console.log('preparedData: ', preparedData);

const svg = d3.select("#chart").style('height', '500px').style('width', '500px');
const { clientWidth, clientHeight } = svg.node();

const margin = 50
const spaceBetweenBars = 0.4;
const textXMargin = 5;
const textYMargin = 25;

const innerWidth = clientWidth - margin * 2;
const innerHeight = clientHeight - margin * 2;

const sums = years.map((_, i) => d3.sum(preparedData.map(({ sales }) => sales[i])));

const scaleX = d3.scaleBand()
  .padding(spaceBetweenBars)
  .domain(years)
  .range([0, innerWidth]);
const scaleY = d3.scaleLinear()
  .domain([0, Math.max(...sums)])
  .nice()
  .range([innerHeight, 0]);
const xAxisWrapper = svg
  .append("g")
  .attr("transform", `translate(${margin}, ${margin + innerHeight})`);
const yAxisWrapper = svg
  .append("g")
  .attr("transform", `translate(${margin}, ${margin})`);

const xAxis = d3.axisBottom(scaleX)
  .tickPadding(10)
  .tickSize(0);
const yAxis = d3.axisLeft(scaleY)
  .tickFormat(
    value => `${(value / 1000000).toFixed(1)} М`
  )
  .tickSize(0);

xAxisWrapper.call(xAxis);
yAxisWrapper.call(yAxis);
const dataMatrix = d3.transpose(preparedData.map(type => type.sales));
const stackData = d3.stack().keys(Object.keys(preparedData))(dataMatrix);
console.log('stackData: ', stackData);
console.log(stackData[2].key);

const chartRoot = svg
  .append("g")
  .attr("class", "chart")
  .attr("transform", `translate(${margin}, ${margin})`);

const stacks = chartRoot.selectAll(".layer").data(stackData);
const layer = stacks
  .enter()
  .append("g")
  .attr("class", "layer")
  .attr("fill", (_, i) => colors[i])
const bandWidth = scaleX.bandwidth();

layer
  .selectAll("rect")
  .data(d => d)
  .enter()
  .append("rect")
  .attr("x", (_, i) => scaleX(years[i]))
  .attr("data-year", (_, i) => years[i])
  .attr("height", ([start, end]) => scaleY(start) - scaleY(end))
  .attr("y", ([, end]) => scaleY(end))
  .transition()
  .duration(1000)
  .attr("width", bandWidth);

layer
  .selectAll('text')
  .data(d => d)
  .enter()
  .append('text')
  .attr('x', (_, i) => scaleX(years[i]) + textXMargin)
  .attr("data-year", (_, i) => years[i])
  .attr("y", ([, end]) => scaleY(end) + textYMargin)
  .transition()
  .text(([start, end]) => `${((end - start) / 1000000).toFixed(2)}`)
  .delay(1000);


const tooltip = d3.select('.tooltip');

layer.on('mouseover', () => {
  tooltip.style('display', 'block');
})

layer.on('mousemove', (evt, targetData) => {
  const currentCity = cities[targetData.key];
  const color = colors[[targetData.key]];
  const year = +evt.target.dataset.year;
  const sales = preparedData
    .find(({city}) => city === currentCity)
    .sales[years.findIndex(y => y === year)];
  tooltip.select('.tooltip__city').text(currentCity);
  tooltip.select('.tooltip__marker').style('background-color', color);
  tooltip.select('.tooltip__year').text(`${year} год`);
  tooltip.select('.tooltip__sales').text(`${sales} денег`);

  const tooltipMarginleft = 20;
  const tooltipMarginBottom = 100;
  tooltip
    .style('left', `${evt.pageX + tooltipMarginleft}px`)
    .style('top', `${evt.pageY - tooltipMarginBottom}px`);
});

layer.on('mouseleave', () => {
  tooltip.style('display', 'none');
})