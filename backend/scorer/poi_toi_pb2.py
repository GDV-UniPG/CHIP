# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: poi_toi.proto
# Protobuf Python Version: 5.27.2
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    27,
    2,
    '',
    'poi_toi.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\rpoi_toi.proto\x12\x07poi_toi\"E\n\x15\x43\x61lculateScoreRequest\x12\x15\n\rpoi_file_path\x18\x01 \x01(\t\x12\x15\n\rtoi_file_path\x18\x02 \x01(\t\"1\n\x16\x43\x61lculateScoreResponse\x12\x17\n\x0fscore_file_path\x18\x01 \x01(\t2a\n\x0cPoiToiScorer\x12Q\n\x0e\x43\x61lculateScore\x12\x1e.poi_toi.CalculateScoreRequest\x1a\x1f.poi_toi.CalculateScoreResponseb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'poi_toi_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  DESCRIPTOR._loaded_options = None
  _globals['_CALCULATESCOREREQUEST']._serialized_start=26
  _globals['_CALCULATESCOREREQUEST']._serialized_end=95
  _globals['_CALCULATESCORERESPONSE']._serialized_start=97
  _globals['_CALCULATESCORERESPONSE']._serialized_end=146
  _globals['_POITOISCORER']._serialized_start=148
  _globals['_POITOISCORER']._serialized_end=245
# @@protoc_insertion_point(module_scope)
