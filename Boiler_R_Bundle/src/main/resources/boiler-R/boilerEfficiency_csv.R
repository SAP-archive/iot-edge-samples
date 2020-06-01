#!/usr/bin/env Rscript
setwd("./")
args = commandArgs(trailingOnly=TRUE)
# test if there is at least one argument: if not, return an error
if (length(args)==0) {
  stop("At least one argument must be supplied (input file).n", call.=FALSE)
} else if (length(args)==1) {
  # default output file
  args[2] = "out.txt"
}
## program...
data = read.table(args[1])
data = read.csv(args[1], sep = ",", header = TRUE)
predictEfficiency <- function(data){
  ## check if model exists? If not, refit:
  if(file.exists("boilerModel.rda")) {
    ## load model
    load("boilerModel.rda")
  } 
  else print("model not found")
  ## predict for new observations
  newdata <- c()
  newdata$temperature <- data[, c("Temperature")]
  newdata$pressure <- data[, c(("Pressure"))]
  return( predict(fit , newdata))
}
output <- c()
output$efficiency <- predictEfficiency(data)
write.table(output, file=args[2])
